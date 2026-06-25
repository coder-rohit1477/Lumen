'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingBag, Search, User, Sun, Moon, Menu, X, Heart, LayoutDashboard, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCart, useAuth } from '@/lib/store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const NAV = [
  { href: '/shop', label: 'Shop All' },
  { href: '/shop?category=men', label: 'Men' },
  { href: '/shop?category=women', label: 'Women' },
  { href: '/shop?category=electronics', label: 'Electronics' },
  { href: '/shop?category=beauty', label: 'Beauty' },
  { href: '/shop?category=home', label: 'Home' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const items = useCart(s => s.items)
  const count = items.reduce((a, i) => a + i.qty, 0)
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  function onSearch(e) {
    e.preventDefault()
    if (!search.trim()) return
    router.push(`/shop?q=${encodeURIComponent(search.trim())}`)
    setSearch('')
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="hidden md:block bg-foreground text-background text-center text-xs py-2 tracking-wider">FREE SHIPPING ON ORDERS OVER ₹1500 • EXTRA 10% OFF WITH CODE LUMEN10</div>
      <div className="container-pad max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">{open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-white font-bold">L</div>
              <span className="text-xl font-semibold tracking-tight" style={{fontFamily:'Playfair Display, serif'}}>Lumen</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={`hover:text-foreground transition-colors ${pathname === n.href ? 'text-foreground' : 'text-muted-foreground'}`}>{n.label}</Link>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden lg:flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." className="pl-9 h-9 rounded-full bg-secondary border-none"/>
            </div>
          </form>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="theme">
              {theme === 'dark' ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </Button>
            <Link href="/account" className="hidden md:block">
              <Button variant="ghost" size="icon"><Heart className="w-4 h-4"/></Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="w-4 h-4"/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel>Hi, {user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={() => router.push('/account')}><LayoutDashboard className="w-4 h-4 mr-2"/>My Account</DropdownMenuItem>
                    {user.role === 'admin' && <DropdownMenuItem onClick={() => router.push('/admin')}><LayoutDashboard className="w-4 h-4 mr-2"/>Admin Panel</DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => { logout(); router.push('/') }}><LogOut className="w-4 h-4 mr-2"/>Logout</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/login')}>Login</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/register')}>Create account</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon"><ShoppingBag className="w-4 h-4"/></Button>
              {count > 0 && <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 grid place-items-center rounded-full bg-amber-500 text-white">{count}</Badge>}
            </Link>
          </div>
        </div>
        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2">
            <form onSubmit={onSearch} className="flex gap-2 mb-2">
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."/>
              <Button type="submit" size="icon"><Search className="w-4 h-4"/></Button>
            </form>
            {NAV.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-2 text-sm border-b border-border">{n.label}</Link>)}
          </div>
        )}
      </div>
    </header>
  )
}
