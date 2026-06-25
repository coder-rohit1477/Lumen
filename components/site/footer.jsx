import Link from 'next/link'
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border mt-16 bg-secondary/40">
      <div className="container-pad max-w-7xl mx-auto py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-white font-bold">L</div>
            <span className="text-xl font-semibold" style={{fontFamily:'Playfair Display, serif'}}>Lumen</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">A curated premium marketplace for fashion, electronics, beauty and home. Designed in India • Made for the world.</p>
          <div className="flex gap-3 mt-4">
            <a className="p-2 rounded-full bg-background border"><Instagram className="w-4 h-4"/></a>
            <a className="p-2 rounded-full bg-background border"><Twitter className="w-4 h-4"/></a>
            <a className="p-2 rounded-full bg-background border"><Facebook className="w-4 h-4"/></a>
            <a className="p-2 rounded-full bg-background border"><Mail className="w-4 h-4"/></a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/shop">All Products</Link></li>
            <li><Link href="/shop?category=men">Men</Link></li>
            <li><Link href="/shop?category=women">Women</Link></li>
            <li><Link href="/shop?category=electronics">Electronics</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/account">My Account</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-pad max-w-7xl mx-auto py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 Lumen Commerce. All rights reserved.</p>
          <p>Secure payments via Razorpay • Free shipping over ₹1500</p>
        </div>
      </div>
    </footer>
  )
}
