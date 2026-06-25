'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/fetcher'
import { toast } from 'sonner'

function Login() {
  const router = useRouter()
  const setAuth = useAuth(s => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) })
      setAuth(token, user)
      toast.success(`Welcome back, ${user.name}`)
      router.push(user.role === 'admin' ? '/admin' : '/account')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="container-pad max-w-md mx-auto py-16">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="border rounded-2xl p-8">
        <h1 className="text-3xl font-semibold mb-2">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to continue your shopping journey.</p>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><Label>Password</Label><Input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>{loading?'Signing in...':'Sign In'}</Button>
        </form>
        <p className="text-sm text-center mt-6 text-muted-foreground">No account? <Link href="/register" className="text-amber-600 hover:underline">Create one</Link></p>
        <p className="text-xs text-center mt-4 text-muted-foreground">Demo admin: admin@lumen.shop / admin123</p>
      </motion.div>
    </div>
  )
}
export default Login
