export async function api(path, options = {}) {
  let token = null
  if (typeof window !== 'undefined') {
    try {
      token = JSON.parse(localStorage.getItem('lumen-auth') || '{}')?.state?.token || null
    } catch {
      token = null
    }
  }
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export function inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }
