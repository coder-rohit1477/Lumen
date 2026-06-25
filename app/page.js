'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/fetcher'
import { ProductCard } from '@/components/site/product-card'
import { ProductGridSkeleton } from '@/components/site/product-grid-skeleton'
import { CATEGORIES, FEATURED_PRODUCTS, BEST_SELLERS, NEW_ARRIVALS } from '@/lib/seed-data'
import { toast } from 'sonner'

function Home() {
  const [products, setProducts] = useState(null)
  const [bestSellers, setBestSellers] = useState(null)
  const [newArrivals, setNewArrivals] = useState(null)
  const [categories, setCategories] = useState([])
  const [email, setEmail] = useState('')
  const [catalogNotice, setCatalogNotice] = useState('')

  useEffect(() => {
    let active = true
    const offlineMessage = 'MongoDB is offline or not configured yet. Showing the bundled premium catalog preview until the database is available. Run `npm run seed` after MongoDB is connected to populate the local database.'
    Promise.allSettled([
      api('/products?featured=1&limit=8'),
      api('/products?bestSeller=1&limit=4'),
      api('/products?newArrival=1&limit=4'),
      api('/categories'),
    ]).then(([featured, best, arrivals, categoryResult]) => {
      if (!active) return
      const offline = [featured, best, arrivals, categoryResult].some((result) => result.status === 'rejected')
      if (offline) setCatalogNotice(offlineMessage)

      setProducts(featured.status === 'fulfilled' && featured.value?.items?.length ? featured.value.items : FEATURED_PRODUCTS.slice(0, 8))
      setBestSellers(best.status === 'fulfilled' && best.value?.items?.length ? best.value.items : BEST_SELLERS.slice(0, 4))
      setNewArrivals(arrivals.status === 'fulfilled' && arrivals.value?.items?.length ? arrivals.value.items : NEW_ARRIVALS.slice(0, 4))
      setCategories(categoryResult.status === 'fulfilled' && categoryResult.value?.length ? categoryResult.value : CATEGORIES)
    })
    return () => { active = false }
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="https://images.unsplash.com/photo-1483985988355-763728e1935b" alt="hero" fill priority className="object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"/>
        </div>
        <div className="container-pad max-w-7xl mx-auto py-24 md:py-36 text-white">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} className="max-w-xl">
            <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-4">New Season Drop — 2025</p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6" style={{fontFamily:'Playfair Display, serif'}}>Luxury, redefined.</h1>
            <p className="text-white/80 mb-8 text-lg">A curated collection of timeless fashion, cutting-edge electronics and elegant home essentials — delivered to your door.</p>
            <div className="flex gap-3">
              <Link href="/shop"><Button size="lg" className="rounded-full bg-amber-500 hover:bg-amber-600 text-white">Shop the Collection <ArrowRight className="w-4 h-4 ml-2"/></Button></Link>
              <Link href="/shop?category=women"><Button size="lg" variant="outline" className="rounded-full text-white border-white/40 hover:bg-white/10 hover:text-white">Women</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {catalogNotice && (
        <section className="container-pad max-w-7xl mx-auto">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            {catalogNotice} Start MongoDB with `mongod` or your local service, then refresh to load live data.
          </div>
        </section>
      )}

      {/* TRUST BAR */}
      <section className="container-pad max-w-7xl mx-auto py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Truck, t:'Free Shipping', s:'On orders over ₹1500' },
          { icon: RotateCcw, t:'7-Day Returns', s:'Hassle-free exchanges' },
          { icon: ShieldCheck, t:'Secure Payments', s:'Razorpay protected' },
          { icon: Headphones, t:'24/7 Support', s:'We are here to help' },
        ].map((f)=>(
          <div key={f.t} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50">
            <f.icon className="w-6 h-6 text-amber-500"/>
            <div><p className="font-medium text-sm">{f.t}</p><p className="text-xs text-muted-foreground">{f.s}</p></div>
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section className="container-pad max-w-7xl mx-auto py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-500 mb-2">Explore</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Shop by Category</h2>
          </div>
          <Link href="/shop" className="text-sm underline-offset-4 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group">
              <motion.div initial={{opacity:0, y:8}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:i*0.05}} className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                <Image src={c.image} alt={c.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                <div className="absolute bottom-3 left-3 right-3 text-white font-medium text-sm">{c.name}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-pad max-w-7xl mx-auto py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-500 mb-2">Curated</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Featured Products</h2>
          </div>
          <Link href="/shop" className="text-sm underline-offset-4 hover:underline">View all</Link>
        </div>
        {!products ? <ProductGridSkeleton/> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p, i) => <ProductCard key={p.id||p.slug} p={p} index={i}/>)}
          </div>
        )}
      </section>

      {/* BANNER */}
      <section className="container-pad max-w-7xl mx-auto py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-white p-10 md:p-16">
          <div className="max-w-lg">
            <p className="uppercase text-xs tracking-widest mb-3 opacity-80">Limited Time</p>
            <h2 className="text-3xl md:text-5xl font-semibold mb-4" style={{fontFamily:'Playfair Display, serif'}}>20% off your first order</h2>
            <p className="opacity-90 mb-6">Use code WELCOME20 at checkout. On orders above ₹2000.</p>
            <Link href="/shop"><Button size="lg" className="rounded-full bg-white text-amber-700 hover:bg-white/90">Shop Now <ArrowRight className="w-4 h-4 ml-2"/></Button></Link>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="container-pad max-w-7xl mx-auto py-10">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold">Best Sellers</h2>
          <Link href="/shop" className="text-sm underline-offset-4 hover:underline">View all</Link>
        </div>
        {!bestSellers ? <ProductGridSkeleton n={4}/> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{bestSellers.map((p,i)=><ProductCard key={p.id||p.slug} p={p} index={i}/>)}</div>
        )}
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-pad max-w-7xl mx-auto py-10">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold">New Arrivals</h2>
          <Link href="/shop" className="text-sm underline-offset-4 hover:underline">View all</Link>
        </div>
        {!newArrivals ? <ProductGridSkeleton n={4}/> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{newArrivals.map((p,i)=><ProductCard key={p.id||p.slug} p={p} index={i}/>)}</div>
        )}
      </section>

      {/* TESTIMONIALS */}
      <section className="container-pad max-w-7xl mx-auto py-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">What customers say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n:'Priya S.', t:'Absolutely loved the leather tote. Premium quality and quick delivery.', r:5 },
            { n:'Rahul M.', t:'The smartwatch is fantastic. Battery actually lasts a week.', r:5 },
            { n:'Aanya K.', t:'My favorite store for everyday luxury. Packaging was beautiful.', r:5 },
          ].map((t)=>(
            <motion.div key={t.n} initial={{opacity:0,y:8}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.1}} className="p-6 rounded-2xl bg-secondary/50 border">
              <div className="flex gap-1 mb-3 text-amber-500">{'★'.repeat(t.r)}</div>
              <p className="text-sm mb-4 italic">“{t.t}”</p>
              <p className="text-sm font-medium">{t.n}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container-pad max-w-3xl mx-auto py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">Join the Lumen list</h2>
        <p className="text-muted-foreground mb-6">Be the first to know about new arrivals and exclusive offers.</p>
        <form onSubmit={(e)=>{e.preventDefault(); toast.success('Subscribed!'); setEmail('')}} className="flex gap-2 max-w-md mx-auto">
          <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="h-12 rounded-full"/>
          <Button type="submit" size="lg" className="rounded-full">Subscribe</Button>
        </form>
      </section>
    </div>
  )
}

export default Home
