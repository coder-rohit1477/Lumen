'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/fetcher'
import { ProductCard } from '@/components/site/product-card'
import { ProductGridSkeleton } from '@/components/site/product-grid-skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CATEGORIES, PRODUCTS } from '@/lib/seed-data'
import { Suspense } from 'react'

function buildFallbackProducts({ category, q, sort, priceRange, page, limit }) {
  let items = [...PRODUCTS]
  if (category) items = items.filter((item) => item.category === category)
  if (q) items = items.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()))
  if (priceRange[0]) items = items.filter((item) => item.price >= priceRange[0])
  if (priceRange[1] < 20000) items = items.filter((item) => item.price <= priceRange[1])

  const sorters = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || (b.rating || 0) - (a.rating || 0),
    new: (a, b) => Number(b.newArrival) - Number(a.newArrival) || Number(b.featured) - Number(a.featured) || (b.rating || 0) - (a.rating || 0),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  }
  items.sort(sorters[sort] || sorters.rating)

  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)
  return { items: paged, total, page, pages: Math.max(1, Math.ceil(total / limit)) }
}

function ShopInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [sort, setSort] = useState('featured')
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [appliedPrice, setAppliedPrice] = useState([0, 20000])
  const [page, setPage] = useState(1)
  const [catalogNotice, setCatalogNotice] = useState('')

  const category = sp.get('category') || ''
  const q = sp.get('q') || ''

  useEffect(() => {
    let active = true
    api('/categories').then((result) => {
      if (active) setCategories(result?.length ? result : CATEGORIES)
    }).catch(() => {
      if (active) setCategories(CATEGORIES)
    })
    return () => { active = false }
  }, [])

  const minPrice = appliedPrice[0]
  const maxPrice = appliedPrice[1]

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    if (minPrice) params.set('min', minPrice)
    if (maxPrice < 20000) params.set('max', maxPrice)
    params.set('sort', sort)
    params.set('page', page)
    const limit = 24
    params.set('limit', limit)
    const priceRange = [minPrice, maxPrice]
    api(`/products?${params}`).then((result) => {
      if (!active) return
      if (result?.items?.length) {
        setData(result)
      } else {
        setData(buildFallbackProducts({ category, q, sort, priceRange, page, limit }))
      }
    }).catch(() => {
      if (!active) return
      setCatalogNotice('MongoDB is offline or not configured yet. Showing the bundled premium catalog preview until the database is available. Run `npm run seed` after MongoDB is connected to populate the local database.')
      setData(buildFallbackProducts({ category, q, sort, priceRange, page, limit }))
    })
    return () => { active = false }
  }, [category, q, sort, minPrice, maxPrice, page])

  function toggleCategory(slug) {
    const params = new URLSearchParams(sp.toString())
    if (params.get('category') === slug) params.delete('category')
    else params.set('category', slug)
    router.push(`/shop?${params}`)
  }

  const Filters = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox id={`cat-${c.slug}`} checked={category===c.slug} onCheckedChange={()=>toggleCategory(c.slug)}/>
              <Label htmlFor={`cat-${c.slug}`} className="text-sm cursor-pointer">{c.name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-3">Price Range</h4>
        <Slider value={priceRange} onValueChange={setPriceRange} onValueCommit={setAppliedPrice} min={0} max={20000} step={500}/>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>₹{priceRange[0]}</span><span>₹{priceRange[1]}</span></div>
      </div>
    </div>
  )

  return (
    <div className="container-pad max-w-7xl mx-auto py-8">
      {catalogNotice && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {catalogNotice} Start MongoDB with `mongod` or your local service, then refresh to load live data.
        </div>
      )}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{q ? `Results for "${q}"` : category ? categories.find(c=>c.slug===category)?.name || 'Shop' : 'All Products'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{data ? `${data.total} products` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm"><SlidersHorizontal className="w-4 h-4 mr-2"/>Filters</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6">{Filters}</div>
            </SheetContent>
          </Sheet>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-8">
        <aside className="hidden lg:block sticky top-24 self-start">{Filters}</aside>
        <div>
          {!data ? <ProductGridSkeleton/> : data.items.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl">
              <p className="text-lg font-medium mb-2">No products found</p>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
              <Button onClick={()=>router.push('/shop')} variant="outline">Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {data.items.map((p,i)=><ProductCard key={p.id||p.slug} p={p} index={i}/>)}
              </div>
              {data.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({length:data.pages}).map((_,i)=>(
                    <Button key={`page-${i+1}`} variant={page===i+1?'default':'outline'} size="sm" onClick={()=>setPage(i+1)}>{i+1}</Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Shop() { return <Suspense fallback={<div className="p-10"><ProductGridSkeleton/></div>}><ShopInner/></Suspense> }
export default Shop
