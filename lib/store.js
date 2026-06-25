'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(persist((set, get) => ({
  items: [], // [{productId, name, price, image, slug, qty}]
  add: (product, qty = 1) => set((s) => {
    const pid = product.id || product.slug
    const ex = s.items.find(i => i.productId === pid)
    if (ex) {
      return { items: s.items.map(i => i.productId === pid ? { ...i, qty: i.qty + qty } : i) }
    }
    return { items: [...s.items, { productId: pid, name: product.name, price: product.price, image: product.images?.[0], slug: product.slug, qty }] }
  }),
  remove: (productId) => set((s) => ({ items: s.items.filter(i => i.productId !== productId) })),
  setQty: (productId, qty) => set((s) => ({ items: s.items.map(i => i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((a, i) => a + i.qty, 0),
  subtotal: () => get().items.reduce((a, i) => a + i.qty * i.price, 0),
}), { name: 'lumen-cart' }))

export const useAuth = create(persist((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}), { name: 'lumen-auth' }))

export const useWishlist = create(persist((set) => ({
  ids: [],
  toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter(x => x !== id) : [...s.ids, id] })),
}), { name: 'lumen-wishlist' }))
