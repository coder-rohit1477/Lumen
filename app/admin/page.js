'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { Package, ShoppingBag, Users, IndianRupee, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/store'
import { api, inr } from '@/lib/fetcher'
import { toast } from 'sonner'

const ORDER_STATUSES = ['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','refunded']

function Admin() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [editProduct, setEditProduct] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    if (user?.role !== 'admin') { router.push('/account'); return }
    Promise.allSettled([
      api('/admin/stats'),
      api('/admin/orders'),
      api('/products?limit=60'),
      api('/admin/users'),
    ]).then(([statsResult, ordersResult, productsResult, usersResult]) => {
      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value)
      if (productsResult.status === 'fulfilled') setProducts(productsResult.value.items)
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
      const failure = [statsResult, ordersResult, productsResult, usersResult].find((result) => result.status === 'rejected')
      if (failure) setLoadError(failure.reason?.message || 'Unable to load admin dashboard')
    })
  }, [token, user, router])

  async function updateStatus(id, status) {
    try { await api(`/admin/orders/${id}`, { method:'PUT', body: JSON.stringify({ status })}); toast.success('Status updated'); setOrders(o => o.map(x => x.id===id?{...x,status}:x)) } catch(e){toast.error(e.message)}
  }

  async function saveProduct() {
    if (!editProduct) return
    try {
      const isNew = !editProduct.id
      const url = isNew ? '/products' : `/admin/products/${editProduct.id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = { ...editProduct, price: Number(editProduct.price), comparePrice: Number(editProduct.comparePrice||0), stock: Number(editProduct.stock||0), images: typeof editProduct.images === 'string' ? editProduct.images.split(',').map(s=>s.trim()).filter(Boolean) : editProduct.images }
      const saved = await api(url, { method, body: JSON.stringify(body) })
      toast.success('Saved')
      setProducts(p => isNew ? [saved, ...p] : p.map(x=>x.id===saved.id?saved:x))
      setOpenDialog(false); setEditProduct(null)
    } catch (e) { toast.error(e.message) }
  }
  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    try { await api(`/admin/products/${id}`, { method:'DELETE' }); setProducts(p=>p.filter(x=>x.id!==id)); toast.success('Deleted') } catch(e){toast.error(e.message)}
  }

  if (loadError) {
    return (
      <div className="container-pad max-w-3xl mx-auto py-20">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
          <h1 className="text-2xl font-semibold mb-2">Admin dashboard unavailable</h1>
          <p className="text-sm">
            {loadError}. Start MongoDB with `mongod` or your local service, then reload the dashboard. If the database is empty, run `npm run seed`.
          </p>
        </div>
      </div>
    )
  }

  if (!stats) return <div className="py-20 text-center">Loading admin dashboard...</div>

  const cards = [
    { label:'Revenue', value: inr(stats.revenue), icon: IndianRupee, color:'from-emerald-500 to-emerald-700' },
    { label:'Total Orders', value: stats.orders, icon: ShoppingBag, color:'from-blue-500 to-blue-700' },
    { label:'Products', value: stats.products, icon: Package, color:'from-purple-500 to-purple-700' },
    { label:'Customers', value: stats.users, icon: Users, color:'from-amber-500 to-amber-700' },
  ]

  return (
    <div className="container-pad max-w-7xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <Link href="/"><Button variant="outline">View Store</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c)=>(
          <motion.div key={c.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05}} className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${c.color}`}>
            <c.icon className="w-8 h-8 opacity-50 absolute right-4 top-4"/>
            <p className="text-sm opacity-80">{c.label}</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="py-6">
          <div className="border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-amber-500"/><h3 className="font-semibold">Revenue (Last 14 days)</h3></div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                <XAxis dataKey="date" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip contentStyle={{ borderRadius: 12 }}/>
                <Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={2.5} dot={{r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="py-6">
          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o=>(
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0,8).toUpperCase()}</TableCell>
                    <TableCell className="text-sm">{o.userEmail || 'Guest'}</TableCell>
                    <TableCell>{o.items.length}</TableCell>
                    <TableCell className="font-semibold">{inr(o.total)}</TableCell>
                    <TableCell><Badge variant={o.paymentStatus==='paid'?'default':'secondary'}>{o.paymentStatus}</Badge></TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v)=>updateStatus(o.id, v)}>
                        <SelectTrigger className="w-40 h-8"><SelectValue/></SelectTrigger>
                        <SelectContent>{ORDER_STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="py-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={()=>setEditProduct({ name:'', slug:'', brand:'', category:'men', price:0, comparePrice:0, stock:0, images:'', description:'' })}><Plus className="w-4 h-4 mr-2"/>Add Product</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader><DialogTitle>{editProduct?.id ? 'Edit' : 'New'} Product</DialogTitle></DialogHeader>
                {editProduct && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Name</Label><Input value={editProduct.name} onChange={e=>setEditProduct({...editProduct,name:e.target.value})}/></div>
                      <div><Label>Slug</Label><Input value={editProduct.slug} onChange={e=>setEditProduct({...editProduct,slug:e.target.value})}/></div>
                      <div><Label>Brand</Label><Input value={editProduct.brand} onChange={e=>setEditProduct({...editProduct,brand:e.target.value})}/></div>
                      <div><Label>Category</Label>
                        <Select value={editProduct.category} onValueChange={v=>setEditProduct({...editProduct,category:v})}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>{['men','women','electronics','home','beauty','accessories'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Price (₹)</Label><Input type="number" value={editProduct.price} onChange={e=>setEditProduct({...editProduct,price:e.target.value})}/></div>
                      <div><Label>Compare Price (₹)</Label><Input type="number" value={editProduct.comparePrice} onChange={e=>setEditProduct({...editProduct,comparePrice:e.target.value})}/></div>
                      <div><Label>Stock</Label><Input type="number" value={editProduct.stock} onChange={e=>setEditProduct({...editProduct,stock:e.target.value})}/></div>
                    </div>
                    <div><Label>Image URLs (comma-separated)</Label><Input value={Array.isArray(editProduct.images)?editProduct.images.join(','):editProduct.images} onChange={e=>setEditProduct({...editProduct,images:e.target.value})}/></div>
                    <div><Label>Description</Label><Textarea rows={4} value={editProduct.description} onChange={e=>setEditProduct({...editProduct,description:e.target.value})}/></div>
                    <Button onClick={saveProduct} className="w-full">Save Product</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map(p=>(
                  <TableRow key={p.id}>
                    <TableCell><div className="flex items-center gap-3"><div className="relative w-10 h-12 rounded overflow-hidden bg-secondary shrink-0"><Image src={p.images?.[0]} fill alt="" className="object-cover"/></div><span className="text-sm font-medium">{p.name}</span></div></TableCell>
                    <TableCell className="text-sm">{p.category}</TableCell>
                    <TableCell>{inr(p.price)}</TableCell>
                    <TableCell><Badge variant={p.stock>0?'secondary':'destructive'}>{p.stock}</Badge></TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={()=>{setEditProduct({...p, images: p.images?.join(',') || ''}); setOpenDialog(true)}}><Edit className="w-4 h-4"/></Button>
                      <Button size="icon" variant="ghost" onClick={()=>deleteProduct(p.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="py-6">
          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map(u=>(
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant={u.role==='admin'?'default':'secondary'}>{u.role}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Admin
