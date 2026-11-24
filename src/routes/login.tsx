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
    <main className="login-page">
      <form onSubmit={handleLogin} className="login-card">
        <p className="login-eyebrow">GUARDIAN ACCESS</p>
        <h1>Sign in</h1>
        <p className="login-intro">Use your guardian codename and password.</p>

        <label className="login-field">
          <span>Codename</span>
          <input autoComplete="username" value={codename} onChange={(e) => setCodename(e.target.value)} placeholder="Enter your codename" required />
        </label>

        <label className="login-field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit"><span>Enter Mission Control</span><span aria-hidden="true">→</span></button>
      </form>
    </main>
  )
}
