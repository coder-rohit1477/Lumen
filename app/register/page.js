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

function Register() {
  const router = useRouter()
  const setAuth = useAuth(s => s.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) })
      setAuth(token, user)
      toast.success('Welcome to Lumen!')
      router.push('/account')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="container-pad max-w-md mx-auto py-16">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="border rounded-2xl p-8">
        <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground mb-6">Join Lumen and unlock exclusive offers.</p>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Full Name</Label><Input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>{loading?'Creating...':'Create Account'}</Button>
        </form>
        <p className="text-sm text-center mt-6 text-muted-foreground">Have an account? <Link href="/login" className="text-amber-600 hover:underline">Sign in</Link></p>
      </motion.div>
    </div>
  )
}
export default Register
