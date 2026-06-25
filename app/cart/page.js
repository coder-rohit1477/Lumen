'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/store'
import { api, inr } from '@/lib/fetcher'
import { toast } from 'sonner'

function Cart() {
  const { items, remove, setQty, subtotal } = useCart()
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [applying, setApplying] = useState(false)
  const sub = subtotal()
  const discount = coupon?.discount || 0
  const shipping = sub > 1500 ? 0 : sub > 0 ? 99 : 0
  const tax = Math.round((sub - discount) * 0.05)
  const total = Math.max(0, sub - discount + shipping + tax)

  async function applyCoupon() {
    if (!code) return
    setApplying(true)
    try {
      const r = await api('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal: sub }) })
      setCoupon(r)
      sessionStorage.setItem('lumen-coupon', r.code)
      toast.success(`Coupon applied! Saved ${inr(r.discount)}`)
    } catch (e) { toast.error(e.message); setCoupon(null) } finally { setApplying(false) }
  }

  if (items.length === 0) return (
    <div className="container-pad max-w-3xl mx-auto py-24 text-center">
      <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4"/>
      <h1 className="text-3xl font-semibold mb-2">Your cart is empty</h1>
      <p className="text-muted-foreground mb-6">Looks like you haven’t added anything yet.</p>
      <Link href="/shop"><Button size="lg" className="rounded-full">Continue Shopping</Button></Link>
    </div>
  )

  return (
    <div className="container-pad max-w-7xl mx-auto py-10">
      <h1 className="text-3xl md:text-4xl font-semibold mb-8">Shopping Cart ({items.length})</h1>
      <div className="grid lg:grid-cols-[1fr,400px] gap-10">
        <div className="space-y-4">
          <AnimatePresence>
            {items.map(it => (
              <motion.div key={it.productId} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-50}} className="flex gap-4 p-4 border rounded-2xl">
                <Link href={`/products/${it.slug}`} className="relative w-24 h-28 rounded-xl overflow-hidden bg-secondary shrink-0">
                  <Image src={it.image} alt={it.name} fill className="object-cover"/>
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link href={`/products/${it.slug}`} className="font-medium hover:underline">{it.name}</Link>
                  <p className="text-sm text-muted-foreground mt-1">{inr(it.price)} each</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border rounded-full">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setQty(it.productId, it.qty-1)}><Minus className="w-3 h-3"/></Button>
                      <span className="px-3 text-sm font-medium">{it.qty}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setQty(it.productId, it.qty+1)}><Plus className="w-3 h-3"/></Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{inr(it.price * it.qty)}</span>
                      <Button variant="ghost" size="icon" onClick={()=>{remove(it.productId); toast.success('Removed')}}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-24 self-start space-y-4">
          <div className="border rounded-2xl p-6 space-y-4 bg-secondary/30">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            <div className="flex gap-2">
              <Input value={code} onChange={e=>setCode(e.target.value)} placeholder="Coupon code (try LUMEN10)" className="bg-background"/>
              <Button onClick={applyCoupon} disabled={applying} variant="outline"><Tag className="w-4 h-4"/></Button>
            </div>
            {coupon && <p className="text-xs text-emerald-600">✓ {coupon.code} applied — saved {inr(coupon.discount)}</p>}
            <Separator/>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(sub)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{inr(discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : inr(shipping)}</span></div>
              <div className="flex justify-between"><span>Tax (5%)</span><span>{inr(tax)}</span></div>
            </div>
            <Separator/>
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{inr(total)}</span></div>
            <Link href="/checkout"><Button size="lg" className="w-full rounded-full">Proceed to Checkout</Button></Link>
            <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:underline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
