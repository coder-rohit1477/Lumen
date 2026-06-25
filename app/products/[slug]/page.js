'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, Heart, ShoppingBag, Truck, Shield, RotateCcw, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { api, inr } from '@/lib/fetcher'
import { useCart, useWishlist, useAuth } from '@/lib/store'
import { ProductCard } from '@/components/site/product-card'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { getProductBySlug, PRODUCTS } from '@/lib/seed-data'

function ProductDetails() {
  const { slug } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [offlineNotice, setOfflineNotice] = useState('')
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const add = useCart(s => s.add)
  const wishToggle = useWishlist(s => s.toggle)
  const wishIds = useWishlist(s => s.ids)
  const { token } = useAuth()

  useEffect(() => {
    let active = true
    api(`/products/${slug}`).then(result => {
      if (active) setData(result)
    }).catch(() => {
      if (!active) return
      const fallbackProduct = getProductBySlug(slug)
      if (!fallbackProduct) {
        setData({ notFound: true })
        return
      }
      setOfflineNotice('MongoDB is offline or the catalog has not been seeded yet. Showing the bundled premium catalog preview. Run `npm run seed` after MongoDB is connected to populate the local database.')
      setData({
        product: fallbackProduct,
        related: PRODUCTS.filter((product) => product.category === fallbackProduct.category && product.slug !== fallbackProduct.slug).slice(0, 4),
        reviews: [],
      })
    })
    return () => {
      active = false
    }
  }, [slug])

  if (!data) return (
    <div className="container-pad max-w-7xl mx-auto py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl shimmer bg-muted"/>
        <div className="space-y-4">
          <div className="h-8 w-2/3 shimmer bg-muted rounded"/>
          <div className="h-4 w-1/3 shimmer bg-muted rounded"/>
          <div className="h-20 w-full shimmer bg-muted rounded"/>
          <div className="h-12 w-full shimmer bg-muted rounded"/>
        </div>
      </div>
    </div>
  )
  if (data.notFound) return <div className="text-center py-20">Product not found</div>

  const { product: p, related, reviews } = data
  const discount = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0
  const wishId = p.id || p.slug
  const wished = wishIds.includes(wishId)

  function buyNow() { add(p, qty); router.push('/checkout') }
  function addToCart() { add(p, qty); toast.success(`${p.name} added to cart`) }

  async function submitReview(e) {
    e.preventDefault()
    if (!token) { toast.error('Please login to review'); router.push('/login'); return }
    setSubmitting(true)
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ productId: p.id, rating: reviewRating, comment: reviewText }) })
      toast.success('Review posted')
      setReviewText('')
      const refreshed = await api(`/products/${slug}`)
      setData(refreshed)
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="container-pad max-w-7xl mx-auto py-10">
      {offlineNotice && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {offlineNotice} Start MongoDB with `mongod` or your local service, then refresh to load live product data.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-10">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary group">
            <Image src={p.images?.[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700"/>
            {discount > 0 && <Badge className="absolute top-4 left-4 bg-amber-500 text-white">{discount}% OFF</Badge>}
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.brand}</p>
          <h1 className="text-3xl md:text-4xl font-semibold">{p.name}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({length:5}).map((_,i)=>(
                <Star key={`star-${i}`} className={`w-4 h-4 ${i < Math.round(p.rating||0) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}/>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{p.rating || 0} ({p.numReviews || 0} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{inr(p.price)}</span>
            {p.comparePrice && <span className="text-lg line-through text-muted-foreground">{inr(p.comparePrice)}</span>}
            {discount > 0 && <span className="text-amber-600 font-medium">Save {discount}%</span>}
          </div>
          <p className="text-muted-foreground leading-relaxed">{p.description}</p>

          {p.stock > 0 ? <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">In Stock ({p.stock} left)</Badge> : <Badge variant="destructive">Out of Stock</Badge>}

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border rounded-full">
              <Button variant="ghost" size="icon" onClick={()=>setQty(Math.max(1,qty-1))}><Minus className="w-4 h-4"/></Button>
              <span className="px-4 font-medium">{qty}</span>
              <Button variant="ghost" size="icon" onClick={()=>setQty(qty+1)}><Plus className="w-4 h-4"/></Button>
            </div>
            <Button size="lg" onClick={addToCart} className="flex-1 rounded-full"><ShoppingBag className="w-4 h-4 mr-2"/>Add to Cart</Button>
            <Button size="icon" variant="outline" onClick={()=>{wishToggle(wishId); toast.success(wished?'Removed':'Added to wishlist')}} className={`rounded-full ${wished?'text-red-500':''}`}><Heart className={`w-4 h-4 ${wished?'fill-current':''}`}/></Button>
          </div>
          <Button onClick={buyNow} variant="outline" size="lg" className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white border-0">Buy Now</Button>

          <Separator/>
          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col items-center text-center gap-2"><Truck className="w-5 h-5 text-amber-500"/>Free Shipping<br/>over ₹1500</div>
            <div className="flex flex-col items-center text-center gap-2"><RotateCcw className="w-5 h-5 text-amber-500"/>7-Day<br/>Returns</div>
            <div className="flex flex-col items-center text-center gap-2"><Shield className="w-5 h-5 text-amber-500"/>Secure<br/>Checkout</div>
          </div>
        </motion.div>
      </div>

      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose dark:prose-invert max-w-none py-6">
            <p className="text-muted-foreground leading-relaxed">{p.description}</p>
            <ul className="mt-4 text-sm space-y-1 text-muted-foreground">
              <li>• Premium materials, ethically sourced</li>
              <li>• Quality-tested before dispatch</li>
              <li>• 1-year manufacturer warranty</li>
            </ul>
          </TabsContent>
          <TabsContent value="reviews" className="py-6 space-y-6">
            {reviews?.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
            {reviews?.map(r => (
              <div key={r.id} className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{r.userName}</span>
                  <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={`star-${i}`} className={`w-3 h-3 ${i<r.rating?'fill-amber-500 text-amber-500':'text-muted'}`}/>)}</div>
                </div>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
            <form onSubmit={submitReview} className="space-y-3 border-t pt-6">
              <h3 className="font-medium">Write a review</h3>
              <div className="flex items-center gap-1">
                {Array.from({length:5}).map((_,i)=>(
                  <button key={`rate-${i}`} type="button" onClick={()=>setReviewRating(i+1)}><Star className={`w-6 h-6 ${i<reviewRating?'fill-amber-500 text-amber-500':'text-muted-foreground'}`}/></button>
                ))}
              </div>
              <Textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Share your experience..." required/>
              <Button type="submit" disabled={submitting}>{submitting?'Posting...':'Post Review'}</Button>
            </form>
          </TabsContent>
          <TabsContent value="shipping" className="py-6 text-sm text-muted-foreground space-y-2">
            <p>• Free shipping on orders above ₹1500. Below that, ₹99 flat.</p>
            <p>• Standard delivery: 3-5 business days across India.</p>
            <p>• 7-day easy returns on most products.</p>
          </TabsContent>
        </Tabs>
      </div>

      {related?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((r,i)=><ProductCard key={r.id||r.slug} p={r} index={i}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetails
