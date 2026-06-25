import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'

export const metadata = {
  title: 'Lumen — Premium Online Store',
  description: 'Discover curated premium fashion, electronics, beauty and home essentials at Lumen.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
