'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart, useWishlist } from '@/lib/store'
import { inr } from '@/lib/fetcher'
import { toast } from 'sonner'

export function ProductCard({ p, index = 0 }) {
  const add = useCart(s => s.add)
  const wishId = p.id || p.slug
  const wished = useWishlist(s => s.ids.includes(wishId))
  const toggle = useWishlist(s => s.toggle)
  const discount = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group relative"
    >
      <Link href={`/products/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary">
          <Image src={p.images?.[0]} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-110"/>
          {discount > 0 && <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-500 text-white">{discount}% OFF</Badge>}
          {p.newArrival && <Badge variant="secondary" className="absolute top-3 right-3">NEW</Badge>}
          <button
            onClick={(e) => { e.preventDefault(); toggle(wishId); toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist') }}
            className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur bg-background/80 transition ${wished ? 'text-red-500' : ''}`}
            aria-label="wishlist"
          >
            <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`}/>
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{p.brand}</p>
          <h3 className="text-sm font-medium leading-tight line-clamp-1">{p.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500"/>
            <span>{p.rating || 0}</span>
            <span>({p.numReviews || 0})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{inr(p.price)}</span>
            {p.comparePrice && <span className="text-xs text-muted-foreground line-through">{inr(p.comparePrice)}</span>}
          </div>
        </div>
      </Link>
      <Button onClick={() => { add(p); toast.success('Added to cart') }} size="sm" className="mt-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">Add to Cart</Button>
    </motion.div>
  )
}
