import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login } from '#/lib/auth/auth.functions'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  const [codename, setCodename] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = await login({
      data: { codename, password },
    })

    if (!result.success) {
      setError('Invalid codename or password.')
      return
    }

    await navigate({ to: '/' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-3xl font-semibold">Guardian Login</h1>

        <input
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          placeholder="Codename"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit">
          Enter Mission Control
        </button>
      </form>
    </main>
  )
}
