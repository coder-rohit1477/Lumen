import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { getDb, clean } from '@/lib/mongo'
import { hashPassword, verifyPassword, signToken, getUserFromRequest } from '@/lib/auth'

function cors(res) {
  const allowedOrigin = process.env.CORS_ORIGINS
  if (allowedOrigin && allowedOrigin !== '*') {
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
const ok = (data, init) => cors(NextResponse.json(data, init))
const err = (msg, status = 400) => cors(NextResponse.json({ error: msg }, { status }))

function mongoErr(error) {
  const message = error?.message || 'MongoDB is unavailable'
  const status = error?.code === 'ENV_MISSING' || error?.code === 'MONGO_URL_INVALID' ? 500 : 503
  return err(message, status)
}

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })) }

async function handler(request, { params }) {
  const { path = [] } = await params
  const route = '/' + path.join('/')
  const method = request.method
  const url = new URL(request.url)
  const q = url.searchParams
  const user = await getUserFromRequest(request)

  try {
    const db = await getDb()

    // Health
    if (route === '/' && method === 'GET') return ok({ message: 'Lumen Commerce API', ok: true })

    // ---------- AUTH ----------
    if (route === '/auth/register' && method === 'POST') {
      const { name, email, password } = await request.json()
      if (!name || !email || !password) return err('All fields required')
      const ex = await db.collection('users').findOne({ email })
      if (ex) return err('Email already registered')
      const u = { id: uuidv4(), name, email, passwordHash: await hashPassword(password), role: 'customer', addresses: [], createdAt: new Date() }
      await db.collection('users').insertOne(u)
      const token = await signToken({ uid: u.id, role: u.role, email: u.email })
      return ok({ token, user: clean(u) })
    }
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      const u = await db.collection('users').findOne({ email })
      if (!u) return err('Invalid credentials', 401)
      const okPw = await verifyPassword(password, u.passwordHash)
      if (!okPw) return err('Invalid credentials', 401)
      const token = await signToken({ uid: u.id, role: u.role, email: u.email })
      return ok({ token, user: clean(u) })
    }
    if (route === '/auth/me' && method === 'GET') {
      if (!user) return err('Not authenticated', 401)
      const u = await db.collection('users').findOne({ id: user.uid })
      if (!u) return err('User not found', 404)
      return ok({ user: clean(u) })
    }

    // ---------- CATEGORIES ----------
    if (route === '/categories' && method === 'GET') {
      const cats = await db.collection('categories').find({}).toArray()
      return ok(clean(cats))
    }

    // ---------- PRODUCTS ----------
    if (route === '/products' && method === 'GET') {
      const query = {}
      if (q.get('category')) query.category = q.get('category')
      if (q.get('brand')) query.brand = q.get('brand')
      if (q.get('featured')) query.featured = true
      if (q.get('bestSeller')) query.bestSeller = true
      if (q.get('newArrival')) query.newArrival = true
      if (q.get('q')) query.name = { $regex: q.get('q'), $options: 'i' }
      const min = Number(q.get('min') || 0)
      const max = Number(q.get('max') || 0)
      if (min || max) query.price = { ...(min ? { $gte: min } : {}), ...(max ? { $lte: max } : {}) }
      const sortKey = q.get('sort') || 'featured'
      const sort = { 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, 'rating': { rating: -1 }, 'new': { createdAt: -1 }, 'featured': { featured: -1, rating: -1 } }[sortKey] || { rating: -1 }
      const limit = Math.min(Number(q.get('limit') || 24), 60)
      const page = Math.max(1, Number(q.get('page') || 1))
      const total = await db.collection('products').countDocuments(query)
      const items = await db.collection('products').find(query).sort(sort).skip((page - 1) * limit).limit(limit).toArray()
      return ok({ items: clean(items), total, page, pages: Math.ceil(total / limit) })
    }
    const productSlugMatch = route.match(/^\/products\/([^/]+)$/)
    if (productSlugMatch && method === 'GET') {
      const slug = productSlugMatch[1]
      const p = await db.collection('products').findOne({ slug })
      if (!p) return err('Product not found', 404)
      const related = await db.collection('products').find({ category: p.category, slug: { $ne: slug } }).limit(4).toArray()
      const reviews = await db.collection('reviews').find({ productId: p.id }).sort({ createdAt: -1 }).limit(20).toArray()
      return ok({ product: clean(p), related: clean(related), reviews: clean(reviews) })
    }
    if (route === '/products' && method === 'POST') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const body = await request.json()
      const p = { id: uuidv4(), createdAt: new Date(), rating: 0, numReviews: 0, ...body }
      await db.collection('products').insertOne(p)
      return ok(clean(p))
    }
    const productIdMatch = route.match(/^\/admin\/products\/([^/]+)$/)
    if (productIdMatch && method === 'PUT') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const body = await request.json()
      delete body._id
      await db.collection('products').updateOne({ id: productIdMatch[1] }, { $set: body })
      const p = await db.collection('products').findOne({ id: productIdMatch[1] })
      return ok(clean(p))
    }
    if (productIdMatch && method === 'DELETE') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      await db.collection('products').deleteOne({ id: productIdMatch[1] })
      return ok({ deleted: true })
    }

    // ---------- REVIEWS ----------
    if (route === '/reviews' && method === 'POST') {
      if (!user) return err('Login required', 401)
      const { productId, rating, comment } = await request.json()
      if (!productId || !rating) return err('productId and rating required')
      const u = await db.collection('users').findOne({ id: user.uid })
      const r = { id: uuidv4(), productId, userId: user.uid, userName: u?.name || 'User', rating: Number(rating), comment: comment || '', createdAt: new Date() }
      await db.collection('reviews').insertOne(r)
      // recompute product rating
      const all = await db.collection('reviews').find({ productId }).toArray()
      const avg = all.reduce((a, x) => a + x.rating, 0) / all.length
      await db.collection('products').updateOne({ id: productId }, { $set: { rating: Math.round(avg * 10) / 10, numReviews: all.length } })
      return ok(clean(r))
    }

    // ---------- COUPONS ----------
    if (route === '/coupons/validate' && method === 'POST') {
      const { code, subtotal } = await request.json()
      const codes = { LUMEN10: { type: 'pct', value: 10, min: 0 }, WELCOME20: { type: 'pct', value: 20, min: 2000 }, FLAT500: { type: 'flat', value: 500, min: 3000 } }
      const c = codes[code?.toUpperCase()]
      if (!c) return err('Invalid coupon')
      if (subtotal < c.min) return err(`Minimum order ₹${c.min} required`)
      const discount = c.type === 'pct' ? Math.round((subtotal * c.value) / 100) : c.value
      return ok({ code: code.toUpperCase(), discount, type: c.type, value: c.value })
    }

    // ---------- ORDERS / RAZORPAY ----------
    if (route === '/orders' && method === 'POST') {
      const body = await request.json()
      const { items, shippingAddress, paymentMethod = 'razorpay', couponCode } = body
      if (!items?.length) return err('Cart is empty')
      if (!shippingAddress) return err('Shipping address required')
      // recompute totals from DB
      const ids = items.map(i => i.productId)
      const dbProducts = await db.collection('products').find({ $or: [{ id: { $in: ids } }, { slug: { $in: ids } }] }).toArray()
      const map = new Map(dbProducts.map(p => [p.id, p]))
      const slugMap = new Map(dbProducts.map(p => [p.slug, p]))
      let subtotal = 0
      const orderItems = items.map(i => {
        const p = map.get(i.productId) || slugMap.get(i.productId)
        if (!p) throw new Error('Invalid product in cart')
        const price = p.price
        subtotal += price * i.qty
        return { productId: p.id, name: p.name, slug: p.slug, image: p.images?.[0], price, qty: i.qty }
      })
      let discount = 0
      if (couponCode) {
        try {
          const r = await fetch(new URL('/api/coupons/validate', request.url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode, subtotal }) })
          const j = await r.json()
          if (r.ok) discount = j.discount
        } catch {}
      }
      const shipping = subtotal > 1500 ? 0 : 99
      const tax = Math.round((subtotal - discount) * 0.05)
      const total = subtotal - discount + shipping + tax
      const orderId = uuidv4()

      let razorpayOrder = null
      const keyId = process.env.RAZORPAY_KEY_ID
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      const usePlaceholder = !keyId || keyId.includes('placeholder')
      if (paymentMethod === 'razorpay' && !usePlaceholder) {
        try {
          const rz = new Razorpay({ key_id: keyId, key_secret: keySecret })
          razorpayOrder = await rz.orders.create({ amount: total * 100, currency: 'INR', receipt: orderId, notes: { orderId } })
        } catch (e) {
          console.error('Razorpay error', e.message)
        }
      }

      const order = {
        id: orderId,
        accessToken: uuidv4(),
        userId: user?.uid || null,
        userEmail: user?.email || body.guestEmail || shippingAddress.email,
        items: orderItems,
        shippingAddress,
        billingAddress: body.billingAddress || shippingAddress,
        subtotal, discount, shipping, tax, total,
        couponCode: couponCode || null,
        paymentMethod,
        paymentStatus: 'pending',
        razorpayOrderId: razorpayOrder?.id || null,
        razorpayPaymentId: null,
        status: 'pending',
        statusHistory: [{ status: 'pending', at: new Date() }],
        createdAt: new Date(),
        testMode: usePlaceholder,
      }
      await db.collection('orders').insertOne(order)
      return ok({ order: clean(order), razorpay: razorpayOrder, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, testMode: usePlaceholder })
    }

    if (route === '/orders/verify' && method === 'POST') {
      const body = await request.json()
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, simulate } = body
      const order = await db.collection('orders').findOne({ id: orderId })
      if (!order) return err('Order not found', 404)
      let verified = false
      if (simulate || order.testMode) {
        verified = true
      } else {
        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex')
        verified = expected === razorpay_signature
      }
      if (!verified) return err('Payment verification failed', 400)
      const upd = {
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id || `SIM_${Date.now()}`,
        statusHistory: [...(order.statusHistory || []), { status: 'confirmed', at: new Date() }],
      }
      await db.collection('orders').updateOne({ id: orderId }, { $set: upd })
      // decrement stock
      for (const it of order.items) {
        await db.collection('products').updateOne({ id: it.productId }, { $inc: { stock: -it.qty } })
      }
      const updated = await db.collection('orders').findOne({ id: orderId })
      return ok({ order: clean(updated) })
    }

    if (route === '/orders' && method === 'GET') {
      if (!user) return err('Login required', 401)
      const orders = await db.collection('orders').find({ userId: user.uid }).sort({ createdAt: -1 }).toArray()
      return ok(clean(orders))
    }
    const orderIdMatch = route.match(/^\/orders\/([^/]+)$/)
    if (orderIdMatch && method === 'GET' && orderIdMatch[1] !== 'verify') {
      const o = await db.collection('orders').findOne({ id: orderIdMatch[1] })
      if (!o) return err('Order not found', 404)
      const accessToken = q.get('token')
      const isOwner = user && (user.role === 'admin' || o.userId === user.uid)
      const isPublicMatch = accessToken && accessToken === o.accessToken
      if (!isOwner && !isPublicMatch) return err('Forbidden', 403)
      return ok(clean(o))
    }

    // ---------- ADMIN ----------
    if (route === '/admin/stats' && method === 'GET') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const [orders, products, users, paid] = await Promise.all([
        db.collection('orders').find({}).toArray(),
        db.collection('products').countDocuments(),
        db.collection('users').countDocuments(),
        db.collection('orders').find({ paymentStatus: 'paid' }).toArray(),
      ])
      const revenue = paid.reduce((a, o) => a + o.total, 0)
      const byDay = {}
      for (const o of paid) {
        const d = new Date(o.createdAt).toISOString().slice(0, 10)
        byDay[d] = (byDay[d] || 0) + o.total
      }
      const chart = Object.entries(byDay).sort().slice(-14).map(([date, value]) => ({ date, value }))
      return ok({ revenue, orders: orders.length, paidOrders: paid.length, products, users, chart })
    }
    if (route === '/admin/orders' && method === 'GET') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      return ok(clean(orders))
    }
    const adminOrderMatch = route.match(/^\/admin\/orders\/([^/]+)$/)
    if (adminOrderMatch && method === 'PUT') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const { status } = await request.json()
      const o = await db.collection('orders').findOne({ id: adminOrderMatch[1] })
      if (!o) return err('Order not found', 404)
      await db.collection('orders').updateOne({ id: adminOrderMatch[1] }, {
        $set: { status }, $push: { statusHistory: { status, at: new Date() } }
      })
      const upd = await db.collection('orders').findOne({ id: adminOrderMatch[1] })
      return ok(clean(upd))
    }
    if (route === '/admin/users' && method === 'GET') {
      if (!user || user.role !== 'admin') return err('Admin only', 403)
      const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray()
      return ok(clean(users))
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    if (e?.code === 'ENV_MISSING' || e?.code === 'MONGO_URL_INVALID' || e?.code === 'MONGO_CONNECTION_FAILED') {
      console.error(`[mongo] ${e.message}`)
      return mongoErr(e)
    }
    console.error('API error', route, e?.message || e)
    return err(e.message || 'Internal server error', 500)
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
