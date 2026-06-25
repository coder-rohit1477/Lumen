'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart, useAuth } from '@/lib/store'
import { api, inr } from '@/lib/fetcher'
import { toast } from 'sonner'

function Checkout() {
  const router = useRouter()
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.name || '', email: user?.email || '', phone: '',
    line1: '', line2: '', city: '', state: '', pincode: '', country: 'India'
  })
  const sub = subtotal()
  const couponCode = typeof window !== 'undefined' ? sessionStorage.getItem('lumen-coupon') : null
  const [discount, setDiscount] = useState(0)
  useEffect(() => {
    if (!couponCode) return
    api('/coupons/validate', { method: 'POST', body: JSON.stringify({ code: couponCode, subtotal: sub }) }).then(r=>setDiscount(r.discount)).catch(()=>{})
  }, [couponCode, sub])
  const shipping = sub > 1500 ? 0 : sub > 0 ? 99 : 0
  const tax = Math.round((sub - discount) * 0.05)
  const total = Math.max(0, sub - discount + shipping + tax)

  useEffect(() => { if (items.length === 0) router.push('/cart') }, [items.length, router])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false)
      if (window.Razorpay) return resolve(true)
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })
  }

  async function placeOrder(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const orderRes = await api('/orders', { method: 'POST', body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, qty: i.qty })),
        shippingAddress: form,
        billingAddress: form,
        paymentMethod: 'razorpay',
        couponCode,
        guestEmail: form.email,
      })})
      const { order, razorpay, keyId, testMode } = orderRes

      if (testMode || !razorpay) {
        // Simulated payment for test mode (no real Razorpay keys)
        toast.info('Test mode: simulating successful payment...')
        const verifyRes = await api('/orders/verify', { method: 'POST', body: JSON.stringify({ orderId: order.id, simulate: true }) })
        clear()
        sessionStorage.removeItem('lumen-coupon')
        router.push(`/order/success?id=${verifyRes.order.id}&t=${verifyRes.order.accessToken}`)
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay')

      const rz = new window.Razorpay({
        key: keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.id,
        name: 'Lumen Commerce',
        description: 'Order #' + order.id.slice(0,8),
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        theme: { color: '#d97706' },
        handler: async (resp) => {
          try {
            const v = await api('/orders/verify', { method: 'POST', body: JSON.stringify({
              orderId: order.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })})
            clear()
            sessionStorage.removeItem('lumen-coupon')
            router.push(`/order/success?id=${v.order.id}&t=${v.order.accessToken}`)
          } catch (e) { toast.error(e.message) }
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rz.open()
    } catch (e) {
      toast.error(e.message)
    } finally { setLoading(false) }
  }

  if (items.length === 0) return null

  return (
    <div className="container-pad max-w-7xl mx-auto py-10">
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1"><Lock className="w-3 h-3"/> Secured by Razorpay • 256-bit SSL</p>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr,400px] gap-10">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><MapPin className="w-5 h-5"/> Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input required value={form.fullName} onChange={e=>set('fullName',e.target.value)}/></div>
              <div><Label>Email *</Label><Input required type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
              <div><Label>Phone *</Label><Input required value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
              <div><Label>Pincode *</Label><Input required value={form.pincode} onChange={e=>set('pincode',e.target.value)}/></div>
              <div className="sm:col-span-2"><Label>Address Line 1 *</Label><Input required value={form.line1} onChange={e=>set('line1',e.target.value)}/></div>
              <div className="sm:col-span-2"><Label>Address Line 2</Label><Input value={form.line2} onChange={e=>set('line2',e.target.value)}/></div>
              <div><Label>City *</Label><Input required value={form.city} onChange={e=>set('city',e.target.value)}/></div>
              <div><Label>State *</Label><Input required value={form.state} onChange={e=>set('state',e.target.value)}/></div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5"/> Payment Method</h2>
            <div className="border rounded-xl p-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="w-10 h-10 rounded-full bg-amber-500 grid place-items-center text-white font-bold">R</div>
              <div>
                <p className="font-medium">Razorpay</p>
                <p className="text-xs text-muted-foreground">UPI • Cards • Netbanking • Wallets</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">⚠️ Running in test mode — add real Razorpay keys to .env to enable live payments. Test orders will auto-complete for demo purposes.</p>
          </div>
        </motion.div>

        <div className="lg:sticky lg:top-24 self-start space-y-4">
          <div className="border rounded-2xl p-6 space-y-3 bg-secondary/30">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-auto">
              {items.map(it => (
                <div key={it.productId} className="flex gap-3 text-sm">
                  <div className="relative w-14 h-16 rounded-md overflow-hidden bg-secondary shrink-0"><Image src={it.image} fill alt="" className="object-cover"/></div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{it.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {it.qty}</p>
                  </div>
                  <p className="font-medium">{inr(it.price * it.qty)}</p>
                </div>
              ))}
            </div>
            <Separator/>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(sub)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon ({couponCode})</span><span>-{inr(discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{shipping===0?'FREE':inr(shipping)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{inr(tax)}</span></div>
            </div>
            <Separator/>
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{inr(total)}</span></div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>{loading?'Processing...':`Pay ${inr(total)}`}</Button>
            <Link href="/cart" className="block text-center text-xs text-muted-foreground hover:underline">← Back to cart</Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout
