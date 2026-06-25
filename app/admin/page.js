'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { LayoutDashboard, ShoppingBag, Package, Users, BarChart3, CreditCard, Warehouse, Settings, IndianRupee, TrendingUp, Plus, Edit, Trash2, Search, Menu, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/store'
import { api, inr } from '@/lib/fetcher'
import { toast } from 'sonner'

const ORDER_STATUSES = ['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','refunded']
const COLORS = ['#d97706','#2563eb','#7c3aed','#059669','#dc2626','#0891b2']

const NAV = [
  { id:'dashboard', label:'Dashboard', icon: LayoutDashboard },
  { id:'orders', label:'Orders', icon: ShoppingBag },
  { id:'products', label:'Products', icon: Package },
  { id:'customers', label:'Customers', icon: Users },
  { id:'analytics', label:'Analytics', icon: BarChart3 },
  { id:'payments', label:'Payments', icon: CreditCard },
  { id:'inventory', label:'Inventory', icon: Warehouse },
  { id:'settings', label:'Settings', icon: Settings },
]

function StatCard({ label, value, sub, color = 'from-slate-700 to-slate-900' }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${color}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function Admin() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [customers, setCustomers] = useState([])
  const [inventory, setInventory] = useState(null)
  const [payments, setPayments] = useState([])
  const [editProduct, setEditProduct] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    if (user?.role !== 'admin') { router.push('/account'); return }
    Promise.allSettled([
      api('/admin/stats'),
      api('/admin/orders'),
      api('/products?limit=60'),
      api('/admin/users'),
      api('/admin/analytics'),
      api('/admin/customers'),
      api('/admin/inventory'),
      api('/admin/payments'),
    ]).then(([s, o, p, u, a, c, inv, pay]) => {
      if (s.status === 'fulfilled') setStats(s.value)
      if (o.status === 'fulfilled') setOrders(o.value)
      if (p.status === 'fulfilled') setProducts(p.value.items || [])
      if (u.status === 'fulfilled') setUsers(u.value)
      if (a.status === 'fulfilled') setAnalytics(a.value)
      if (c.status === 'fulfilled') setCustomers(c.value)
      if (inv.status === 'fulfilled') setInventory(inv.value)
      if (pay.status === 'fulfilled') setPayments(pay.value)
      const fail = [s, o, p, u].find(r => r.status === 'rejected')
      if (fail) setLoadError(fail.reason?.message || 'Failed to load')
    })
  }, [token, user, router])

  async function updateStatus(id, status) {
    try {
      await api(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      toast.success('Status updated')
      setOrders(prev => prev.map(x => x.id === id ? { ...x, status } : x))
    } catch (e) { toast.error(e.message) }
  }

  async function saveProduct() {
    if (!editProduct) return
    try {
      const isNew = !editProduct.id
      const url = isNew ? '/products' : `/admin/products/${editProduct.id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = { ...editProduct, price: Number(editProduct.price), comparePrice: Number(editProduct.comparePrice || 0), stock: Number(editProduct.stock || 0), images: typeof editProduct.images === 'string' ? editProduct.images.split(',').map(s => s.trim()).filter(Boolean) : editProduct.images }
      const saved = await api(url, { method, body: JSON.stringify(body) })
      toast.success('Saved')
      setProducts(prev => isNew ? [saved, ...prev] : prev.map(x => x.id === saved.id ? saved : x))
      setOpenDialog(false)
      setEditProduct(null)
    } catch (e) { toast.error(e.message) }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(x => x.id !== id))
      toast.success('Deleted')
    } catch (e) { toast.error(e.message) }
  }

  if (loadError) return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
        <h1 className="text-2xl font-semibold mb-2">Admin unavailable</h1>
        <p className="text-sm">{loadError}. Start MongoDB and run `npm run seed`.</p>
      </div>
    </div>
  )
  if (!stats) return <div className="py-20 text-center text-muted-foreground">Loading admin dashboard...</div>

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
  const lowStockCount = inventory?.lowStock?.length || products.filter(p => p.stock > 0 && p.stock <= 10).length

  const filteredOrders = orders.filter(o => {
    if (orderSearch) {
      const s = orderSearch.toLowerCase()
      if (!o.id.toLowerCase().includes(s) && !(o.userEmail || '').toLowerCase().includes(s)) return false
    }
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false
    if (paymentStatusFilter !== 'all' && o.paymentStatus !== paymentStatusFilter) return false
    return true
  })

  const filteredPayments = payments.filter(p => paymentFilter === 'all' || p.paymentStatus === paymentFilter)


  return (
    <div className="flex min-h-screen">
      {/* Mobile nav toggle */}
      <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border shadow-sm">
        {mobileNav ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform ${mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Lumen Admin</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setMobileNav(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${tab === n.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              <n.icon className="w-4 h-4"/>{n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <Link href="/"><Button variant="outline" className="w-full" size="sm">View Store</Button></Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Revenue" value={inr(stats.revenue)} color="from-emerald-500 to-emerald-700"/>
              <StatCard label="Orders" value={stats.orders} color="from-blue-500 to-blue-700"/>
              <StatCard label="Customers" value={stats.users} color="from-purple-500 to-purple-700"/>
              <StatCard label="Products" value={stats.products} color="from-amber-500 to-amber-700"/>
              <StatCard label="Pending" value={pendingOrders} color="from-yellow-500 to-yellow-700"/>
              <StatCard label="Delivered" value={deliveredOrders} color="from-green-600 to-green-800"/>
              <StatCard label="Cancelled" value={cancelledOrders} color="from-red-500 to-red-700"/>
              <StatCard label="Low Stock" value={lowStockCount} color="from-orange-500 to-orange-700"/>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500"/>Revenue (14 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.chart}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="date" fontSize={10} tickFormatter={d=>d.slice(5)}/><YAxis fontSize={10}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={2} dot={false}/></LineChart>
                </ResponsiveContainer>
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-blue-500"/>Orders (14 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.chart}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="date" fontSize={10} tickFormatter={d=>d.slice(5)}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Top Products</h3>
                {analytics?.topProducts?.length ? analytics.topProducts.map(p => (
                  <div key={p.name} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span className="truncate mr-2">{p.name}</span><Badge variant="secondary">{p.qty} sold</Badge></div>
                )) : <p className="text-sm text-muted-foreground">No sales data yet</p>}
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Latest Orders</h3>
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span className="font-mono text-xs">#{o.id.slice(0,8)}</span><span>{inr(o.total)}</span><Badge variant="secondary" className="text-xs">{o.status}</Badge></div>
                ))}
                {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet</p>}
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Recent Customers</h3>
                {users.slice(0, 5).map(u => (
                  <div key={u.id || u.email} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span className="truncate">{u.name}</span><span className="text-xs text-muted-foreground">{u.email}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Orders</h1>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"/><Input placeholder="Search order ID or email..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9"/></div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Payment"/></SelectTrigger><SelectContent><SelectItem value="all">All Payment</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
            </div>
            <div className="border rounded-2xl overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">#{o.id.slice(0,8).toUpperCase()}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{o.userEmail || 'Guest'}</TableCell>
                      <TableCell>{o.items?.length || 0}</TableCell>
                      <TableCell className="font-semibold">{inr(o.total)}</TableCell>
                      <TableCell><Badge variant={o.paymentStatus === 'paid' ? 'default' : 'secondary'}>{o.paymentStatus}</Badge></TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        )}


        {/* PRODUCTS */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Products</h1>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild><Button onClick={() => setEditProduct({ name:'', slug:'', brand:'', category:'men', price:0, comparePrice:0, stock:0, images:'', description:'', featured:false, bestSeller:false, newArrival:false })}><Plus className="w-4 h-4 mr-2"/>Add Product</Button></DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                  <DialogHeader><DialogTitle>{editProduct?.id ? 'Edit' : 'New'} Product</DialogTitle></DialogHeader>
                  {editProduct && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Name</Label><Input value={editProduct.name} onChange={e => setEditProduct({...editProduct, name: e.target.value})}/></div>
                        <div><Label>Slug</Label><Input value={editProduct.slug} onChange={e => setEditProduct({...editProduct, slug: e.target.value})}/></div>
                        <div><Label>Brand</Label><Input value={editProduct.brand} onChange={e => setEditProduct({...editProduct, brand: e.target.value})}/></div>
                        <div><Label>Category</Label><Select value={editProduct.category} onValueChange={v => setEditProduct({...editProduct, category: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['men','women','electronics','home','beauty','accessories'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Price (₹)</Label><Input type="number" value={editProduct.price} onChange={e => setEditProduct({...editProduct, price: e.target.value})}/></div>
                        <div><Label>Compare Price</Label><Input type="number" value={editProduct.comparePrice} onChange={e => setEditProduct({...editProduct, comparePrice: e.target.value})}/></div>
                        <div><Label>Stock</Label><Input type="number" value={editProduct.stock} onChange={e => setEditProduct({...editProduct, stock: e.target.value})}/></div>
                      </div>
                      <div><Label>Images (comma-separated URLs)</Label><Input value={Array.isArray(editProduct.images) ? editProduct.images.join(',') : editProduct.images} onChange={e => setEditProduct({...editProduct, images: e.target.value})}/></div>
                      <div><Label>Description</Label><Textarea rows={3} value={editProduct.description} onChange={e => setEditProduct({...editProduct, description: e.target.value})}/></div>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={editProduct.featured} onCheckedChange={v => setEditProduct({...editProduct, featured: v})}/>Featured</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={editProduct.bestSeller} onCheckedChange={v => setEditProduct({...editProduct, bestSeller: v})}/>Best Seller</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={editProduct.newArrival} onCheckedChange={v => setEditProduct({...editProduct, newArrival: v})}/>New Arrival</label>
                      </div>
                      <Button onClick={saveProduct} className="w-full">Save Product</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-2xl overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Flags</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id || p.slug}>
                      <TableCell><div className="flex items-center gap-3"><div className="relative w-10 h-12 rounded overflow-hidden bg-secondary shrink-0">{p.images?.[0] && <Image src={p.images[0]} fill alt="" className="object-cover"/>}</div><span className="text-sm font-medium">{p.name}</span></div></TableCell>
                      <TableCell className="text-sm">{p.category}</TableCell>
                      <TableCell>{inr(p.price)}</TableCell>
                      <TableCell><Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'}>{p.stock || 0}</Badge></TableCell>
                      <TableCell><div className="flex gap-1">{p.featured && <Badge variant="default" className="text-xs">F</Badge>}{p.bestSeller && <Badge variant="secondary" className="text-xs">BS</Badge>}{p.newArrival && <Badge variant="outline" className="text-xs">N</Badge>}</div></TableCell>
                      <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditProduct({...p, images: p.images?.join(',') || ''}); setOpenDialog(true) }}><Edit className="w-4 h-4"/></Button><Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}


        {/* CUSTOMERS */}
        {tab === 'customers' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Customers</h1>
            <div className="border rounded-2xl overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Orders</TableHead><TableHead>Spending</TableHead><TableHead>Joined</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id || c.email}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.email}</TableCell>
                      <TableCell>{c.totalOrders}</TableCell>
                      <TableCell className="font-semibold">{inr(c.totalSpending)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={c.role === 'admin' ? 'default' : 'secondary'}>{c.role}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {customers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <StatCard label="Total Revenue" value={inr(analytics?.totalRevenue || 0)} color="from-emerald-500 to-emerald-700"/>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Daily Sales (30 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.dailySales || []}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="date" fontSize={10} tickFormatter={d=>d.slice(5)}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="total" fill="#d97706" radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Weekly Sales (12 weeks)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.weeklySales || []}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="week" fontSize={10} tickFormatter={d=>d.slice(5)}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="total" fill="#2563eb" radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Monthly Sales (6 months)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.monthlySales || []}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="month" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="total" fill="#7c3aed" radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Category Performance</h3>
                {analytics?.categoryPerformance?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={analytics.categoryPerformance} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({category})=>category}>{analytics.categoryPerformance.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">No data yet</p>}
              </div>
            </div>
            <div className="border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Best Selling Products</h3>
              {analytics?.topProducts?.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.topProducts} layout="vertical"><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis type="number" fontSize={10}/><YAxis type="category" dataKey="name" fontSize={10} width={120}/><Tooltip/><Bar dataKey="qty" fill="#059669" radius={[0,4,4,0]}/></BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No sales data yet</p>}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Payments</h1>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Paid" value={payments.filter(p => p.paymentStatus === 'paid').length} color="from-green-500 to-green-700"/>
              <StatCard label="Pending" value={payments.filter(p => p.paymentStatus === 'pending').length} color="from-yellow-500 to-yellow-700"/>
              <StatCard label="Failed" value={payments.filter(p => p.paymentStatus === 'failed').length} color="from-red-500 to-red-700"/>
            </div>
            <div className="border rounded-2xl overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">#{p.id.slice(0,8).toUpperCase()}</TableCell>
                      <TableCell className="text-sm">{p.userEmail || 'Guest'}</TableCell>
                      <TableCell className="font-semibold">{inr(p.total)}</TableCell>
                      <TableCell className="text-sm">{p.paymentMethod || '-'}</TableCell>
                      <TableCell><Badge variant={p.paymentStatus === 'paid' ? 'default' : p.paymentStatus === 'pending' ? 'secondary' : 'destructive'}>{p.paymentStatus}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredPayments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Inventory</h1>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Stock" value={inventory?.totalItems || 0} color="from-blue-500 to-blue-700"/>
              <StatCard label="Low Stock" value={inventory?.lowStock?.length || 0} color="from-orange-500 to-orange-700"/>
              <StatCard label="Out of Stock" value={inventory?.outOfStock?.length || 0} color="from-red-500 to-red-700"/>
            </div>
            {inventory?.lowStock?.length > 0 && (
              <div className="border rounded-2xl overflow-auto">
                <div className="p-4 border-b"><h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500"/>Low Stock Products</h3></div>
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
                  <TableBody>{inventory.lowStock.map(p => (<TableRow key={p.id || p.slug}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell><Badge variant="outline">{p.stock}</Badge></TableCell></TableRow>))}</TableBody>
                </Table>
              </div>
            )}
            {inventory?.outOfStock?.length > 0 && (
              <div className="border rounded-2xl overflow-auto">
                <div className="p-4 border-b"><h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500"/>Out of Stock</h3></div>
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
                  <TableBody>{inventory.outOfStock.map(p => (<TableRow key={p.id || p.slug}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell></TableRow>))}</TableBody>
                </Table>
              </div>
            )}
            {(!inventory?.lowStock?.length && !inventory?.outOfStock?.length) && <p className="text-muted-foreground text-center py-8">All products are well-stocked!</p>}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <div className="border rounded-2xl p-6 space-y-4 max-w-xl">
              <h3 className="font-semibold">Store Information</h3>
              <div><Label>Store Name</Label><Input defaultValue="Lumen Commerce"/></div>
              <div><Label>Contact Email</Label><Input defaultValue="support@lumen.shop"/></div>
              <div><Label>Description</Label><Textarea defaultValue="Premium lifestyle store offering curated collections."/></div>
              <Button onClick={() => toast.success('Settings saved')}>Save Changes</Button>
            </div>
            <div className="border rounded-2xl p-6 space-y-4 max-w-xl">
              <h3 className="font-semibold">Payment Settings</h3>
              <div className="flex items-center justify-between"><span className="text-sm">Razorpay Integration</span><Badge variant={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'default' : 'secondary'}>{process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Active' : 'Test Mode'}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm">COD Enabled</span><Switch defaultChecked/></div>
            </div>
            <div className="border rounded-2xl p-6 space-y-4 max-w-xl">
              <h3 className="font-semibold">Admin Account</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {user?.name}</p>
                <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                <p><span className="text-muted-foreground">Role:</span> <Badge>{user?.role}</Badge></p>
              </div>
            </div>
            <div className="border rounded-2xl p-6 space-y-4 max-w-xl">
              <h3 className="font-semibold">User Management</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                <TableBody>{users.slice(0, 10).map(u => (<TableRow key={u.id || u.email}><TableCell>{u.name}</TableCell><TableCell className="text-sm">{u.email}</TableCell><TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
