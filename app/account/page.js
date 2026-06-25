'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, User as UserIcon, Heart, LogOut, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth, useWishlist } from '@/lib/store'
import { api, inr } from '@/lib/fetcher'

function Account() {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const [orders, setOrders] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const wishIds = useWishlist(s => s.ids)
  const wishProducts = useMemo(
    () => allProducts.filter(p => wishIds.includes(p.id) || wishIds.includes(p.slug)),
    [allProducts, wishIds]
  )

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    api('/orders').then(setOrders).catch(()=>setOrders([]))
  }, [token, router])

  useEffect(() => {
    if (wishIds.length === 0) return
    api('/products?limit=60').then(d => setAllProducts(d.items)).catch(()=>{})
  }, [wishIds])

  if (!user) return null

  const STATUS_COLORS = { pending:'bg-gray-100 text-gray-700', confirmed:'bg-blue-100 text-blue-700', packed:'bg-purple-100 text-purple-700', shipped:'bg-indigo-100 text-indigo-700', delivered:'bg-emerald-100 text-emerald-700', cancelled:'bg-red-100 text-red-700' }

  return (
    <div className="container-pad max-w-6xl mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">My Account</h1>
          <p className="text-muted-foreground">Hi, {user.name} — {user.email}</p>
        </div>
        <Button variant="outline" onClick={()=>{logout(); router.push('/')}}><LogOut className="w-4 h-4 mr-2"/>Logout</Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders"><Package className="w-4 h-4 mr-2"/>Orders</TabsTrigger>
          <TabsTrigger value="wishlist"><Heart className="w-4 h-4 mr-2"/>Wishlist</TabsTrigger>
          <TabsTrigger value="profile"><UserIcon className="w-4 h-4 mr-2"/>Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="py-6 space-y-4">
          {!orders ? <p>Loading...</p> : orders.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2"/>
              <p className="font-medium">No orders yet</p>
              <Link href="/shop"><Button className="mt-4">Start Shopping</Button></Link>
            </div>
          ) : orders.map(o => (
            <div key={o.id} className="border rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium">Order #{o.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()} • {o.items.length} items</p>
                </div>
                <Badge className={STATUS_COLORS[o.status] || ''}>{o.status.toUpperCase()}</Badge>
              </div>
              <div className="flex gap-2 overflow-auto pb-2">
                {o.items.map(it => (
                  <div key={it.productId} className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary shrink-0">
                    <Image src={it.image} fill alt="" className="object-cover"/>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t mt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{inr(o.total)}</span>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="wishlist" className="py-6">
          {wishProducts.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-2"/>
              <p className="font-medium">Your wishlist is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {wishProducts.map(p => (
                <Link key={p.id || p.slug} href={`/products/${p.slug}`} className="group">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary">
                    <Image src={p.images?.[0]} fill alt={p.name} className="object-cover group-hover:scale-105 transition"/>
                  </div>
                  <p className="mt-2 text-sm font-medium">{p.name}</p>
                  <p className="text-sm font-semibold">{inr(p.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="py-6">
          <div className="border rounded-2xl p-6 space-y-3 max-w-xl">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{user.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{user.role}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Account
