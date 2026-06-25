'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, inr } from '@/lib/fetcher'

function OrderInner() {
  const sp = useSearchParams()
  const id = sp.get('id')
  const token = sp.get('t')
  const [order, setOrder] = useState(null)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    if (!id) return
    const suffix = token ? `?token=${encodeURIComponent(token)}` : ''
    api(`/orders/${id}${suffix}`).then(setOrder).catch((error) => {
      setLoadError(error?.message || 'Unable to load order details')
    })
  }, [id, token])

  if (loadError) {
    return (
      <div className="container-pad max-w-3xl mx-auto py-20">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
          <h1 className="text-2xl font-semibold mb-2">Order details unavailable</h1>
          <p className="text-sm">
            {loadError}. Start MongoDB with `mongod` or your local service, then reload this page.
          </p>
        </div>
      </div>
    )
  }

  if (!order) return <div className="py-20 text-center">Loading...</div>

  return (
    <div className="container-pad max-w-3xl mx-auto py-12">
      <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring'}} className="text-center mb-10">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 grid place-items-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600"/>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">Thank you for shopping with Lumen. We’ve emailed you the details.</p>
        <p className="text-sm mt-2">Order ID: <span className="font-mono">#{order.id.slice(0,8).toUpperCase()}</span></p>
      </motion.div>

      <div className="border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Order Details</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">{order.status.toUpperCase()}</span>
        </div>
        <div className="space-y-3">
          {order.items.map(it=>(
            <div key={it.productId} className="flex gap-3">
              <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary shrink-0"><Image src={it.image} fill alt="" className="object-cover"/></div>
              <div className="flex-1">
                <p className="font-medium text-sm">{it.name}</p>
                <p className="text-xs text-muted-foreground">Qty {it.qty} × {inr(it.price)}</p>
              </div>
              <p className="text-sm font-semibold">{inr(it.qty * it.price)}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
          {order.discount>0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{inr(order.discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{order.shipping===0?'FREE':inr(order.shipping)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{inr(order.tax)}</span></div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t"><span>Total Paid</span><span>{inr(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-6 border rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Shipping Address</h2>
        <p className="text-sm text-muted-foreground">{order.shippingAddress.fullName}<br/>{order.shippingAddress.line1}{order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}<br/>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br/>{order.shippingAddress.phone}</p>
      </div>

      <div className="mt-6 grid grid-cols-3 text-center text-xs gap-2">
        {['Confirmed','Packed','Shipped','Out for Delivery','Delivered'].slice(0,3).map((s,i)=>(
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full grid place-items-center ${i===0?'bg-emerald-500 text-white':'bg-secondary'}`}>{i===0?<CheckCircle2 className="w-4 h-4"/>:i===1?<Package className="w-4 h-4"/>:<Truck className="w-4 h-4"/>}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <Link href="/shop" className="flex-1"><Button variant="outline" className="w-full rounded-full">Continue Shopping</Button></Link>
        <Link href="/account" className="flex-1"><Button className="w-full rounded-full">View Orders</Button></Link>
      </div>
    </div>
  )
}

function OrderSuccess() { return <Suspense fallback={<div className="py-20 text-center">Loading...</div>}><OrderInner/></Suspense> }
export default OrderSuccess
