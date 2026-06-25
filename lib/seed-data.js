// Curated product seed data
export const CATEGORIES = [
  { id: 'men', slug: 'men', name: "Men's Fashion", image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22' },
  { id: 'women', slug: 'women', name: "Women's Fashion", image: 'https://images.pexels.com/photos/7202800/pexels-photo-7202800.jpeg' },
  { id: 'electronics', slug: 'electronics', name: 'Electronics', image: 'https://images.unsplash.com/photo-1545127398-14699f92334b' },
  { id: 'home', slug: 'home', name: 'Home & Decor', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013' },
  { id: 'beauty', slug: 'beauty', name: 'Beauty', image: 'https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1' },
  { id: 'accessories', slug: 'accessories', name: 'Accessories', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d' },
]

export const PRODUCTS = [
  { slug: 'heritage-leather-watch', name: 'Heritage Leather Watch', brand: 'Lumen', category: 'accessories', price: 8999, comparePrice: 14999, stock: 24, featured: true, bestSeller: true, rating: 4.8, numReviews: 128,
    images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6'],
    description: 'A timeless leather strap watch with sapphire crystal and Japanese movement. Hand-finished case and water resistant up to 50m.' },
  { slug: 'cloudstep-runner-sneakers', name: 'CloudStep Runner Sneakers', brand: 'Lumen Sport', category: 'men', price: 4499, comparePrice: 6999, stock: 40, featured: true, bestSeller: true, rating: 4.7, numReviews: 312,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a'],
    description: 'Ultra-light cushioned runners with breathable knit upper and energy-return foam sole. Designed for daily runs and city wear.' },
  { slug: 'aviator-titanium-sunglasses', name: 'Aviator Titanium Sunglasses', brand: 'SunBloc', category: 'accessories', price: 3299, comparePrice: 4999, stock: 60, featured: true, newArrival: true, rating: 4.6, numReviews: 76,
    images: ['https://images.unsplash.com/photo-1584036553516-bf83210aa16c'],
    description: 'Polarized aviator sunglasses crafted with featherweight titanium frame and UV400 protected lenses.' },
  { slug: 'milano-leather-tote-bag', name: 'Milano Leather Tote Bag', brand: 'Atelier', category: 'women', price: 7499, comparePrice: 11999, stock: 18, featured: true, bestSeller: true, rating: 4.9, numReviews: 92,
    images: ['https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6'],
    description: 'Hand-crafted full-grain leather tote with brushed-gold hardware and suede-lined interior. A modern classic.' },
  { slug: 'aura-wireless-headphones', name: 'Aura Wireless Headphones', brand: 'SonicLab', category: 'electronics', price: 12999, comparePrice: 17999, stock: 32, featured: true, bestSeller: true, rating: 4.7, numReviews: 540,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
    description: 'Studio-grade ANC headphones with 40h battery, hi-res audio and multipoint Bluetooth 5.3 connection.' },
  { slug: 'pulse-smartwatch-pro', name: 'Pulse Smartwatch Pro', brand: 'Pulse', category: 'electronics', price: 15999, comparePrice: 19999, stock: 27, featured: true, newArrival: true, rating: 4.5, numReviews: 218,
    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a'],
    description: 'Always-on AMOLED smartwatch with ECG, SpO2, AI sleep tracking and 7-day battery life.' },
  { slug: 'noir-eau-de-parfum', name: 'Noir Eau de Parfum 100ml', brand: 'Maison Noir', category: 'beauty', price: 5499, comparePrice: 7999, stock: 45, featured: true, newArrival: true, rating: 4.8, numReviews: 64,
    images: ['https://images.unsplash.com/photo-1458538977777-0549b2370168'],
    description: 'Woody amber fragrance with notes of bergamot, oud and vetiver. Crafted in Grasse, France.' },
  { slug: 'velvet-matte-lipstick', name: 'Velvet Matte Lipstick', brand: 'Glow Co', category: 'beauty', price: 899, comparePrice: 1299, stock: 120, bestSeller: true, rating: 4.6, numReviews: 401,
    images: ['https://images.unsplash.com/photo-1625093742435-6fa192b6fb10'],
    description: 'Long-wear vegan matte lipstick with vitamin E. 24 shades. Cruelty-free and paraben-free.' },
  { slug: 'arc-minimalist-table-lamp', name: 'Arc Minimalist Table Lamp', brand: 'NordHaus', category: 'home', price: 3999, comparePrice: 5499, stock: 22, featured: true, newArrival: true, rating: 4.7, numReviews: 51,
    images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89'],
    description: 'Sculptural matte-finish desk lamp with warm dimmable LED and touch controls.' },
  { slug: 'kyoto-ceramic-vase', name: 'Kyoto Ceramic Vase', brand: 'NordHaus', category: 'home', price: 1899, comparePrice: 2899, stock: 36, rating: 4.5, numReviews: 28,
    images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c'],
    description: 'Hand-thrown stoneware vase with stone-glaze finish. Each piece is one-of-a-kind.' },
  { slug: 'essential-cotton-tshirt', name: 'Essential Cotton T-Shirt', brand: 'Lumen', category: 'men', price: 999, comparePrice: 1499, stock: 200, bestSeller: true, rating: 4.4, numReviews: 612,
    images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820'],
    description: 'Premium 240gsm combed cotton tee with reinforced collar. Perfect-fit silhouette.' },
  { slug: 'silk-blend-summer-dress', name: 'Silk-Blend Summer Dress', brand: 'Atelier', category: 'women', price: 4299, comparePrice: 6499, stock: 31, newArrival: true, featured: true, rating: 4.7, numReviews: 89,
    images: ['https://images.unsplash.com/flagged/photo-1585052201332-b8c0ce30972f'],
    description: 'Flowy silk-blend midi dress with adjustable straps. Effortless elegance for warm days.' },
]

export const FEATURED_PRODUCTS = PRODUCTS.filter((product) => product.featured)
export const BEST_SELLERS = PRODUCTS.filter((product) => product.bestSeller)
export const NEW_ARRIVALS = PRODUCTS.filter((product) => product.newArrival)

export function getProductBySlug(slug) {
  return PRODUCTS.find((product) => product.slug === slug)
}
