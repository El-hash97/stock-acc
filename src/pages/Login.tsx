import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login as loginRequest } from '@/lib/api'
import { useSessionStore } from '@/store/session'

export default function Login() {
  const navigate = useNavigate()
  const login = useSessionStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Username dan password wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await loginRequest(username.trim(), password)
      login(result.token, result.user)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Storefront size={30} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Konter</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Monitoring Penjualan &amp; Stok Aksesoris
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Username
            </label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mis. budi.owner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2 h-11">
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  )
}
