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
    <main className="login-page login-page-scifi">
      <div className="login-backdrop-grid" aria-hidden="true" />
      <section className="login-showcase">
        <div className="login-brand-mark"><span>✧</span></div>
        <p className="login-eyebrow">ACHRONA DEFENSE NETWORK</p>
        <h1>GUARDIANS<br /><span>OF THE GRID</span></h1>
        <p className="login-showcase-copy">The grid is only as strong as the Guardians protecting it. Connect to Mission Control and defend Achrona.</p>
        <div className="login-system-status"><i /> GRID CONNECTION STABLE <span>///</span> ENCRYPTED</div>
        <div className="login-orbit-art" aria-hidden="true"><span /><span /><span /><b /></div>
      </section>

      <form onSubmit={handleLogin} className="login-card login-card-scifi">
        <p className="login-eyebrow">GUARDIAN AUTHENTICATION</p>
        <h2>Access Mission Control</h2>
        <p className="login-intro">Identify yourself to enter the Achrona defense network.</p>

        <label className="login-field">
          <span>GUARDIAN CODENAME</span>
          <input autoComplete="username" value={codename} onChange={(e) => setCodename(e.target.value)} placeholder="Enter your codename" required />
        </label>

        <label className="login-field">
          <span>ACCESS KEY</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit"><span>INITIALIZE CONNECTION</span><span aria-hidden="true">→</span></button>
        <p className="login-secure-note"> <span /> SECURE GUARDIAN CHANNEL · AUTHORIZED PERSONNEL ONLY</p>
      </form>
    </main>
  )
}
