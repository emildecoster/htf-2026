import { logout } from '#/lib/auth/auth.functions.ts'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  LayoutDashboard,
  LogOut,
  ScanEye,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

type NavItem = {
  label: string
  icon: LucideIcon
  to: '/' | '/report-echo'
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'Report Echo', icon: ScanEye, to: '/report-echo' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError(false)
    try {
      const result = await logout()
      if (!result?.success) throw new Error('Logout failed')
      await navigate({ to: '/login', replace: true })
    } catch {
      setLogoutError(true)
      setLoggingOut(false)
    }
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand" aria-label="Guardians of the Grid">
        <span className="sidebar-brand-mark"><Activity size={23} /></span>
        <span className="sidebar-brand-copy">
          <strong>GUARDIANS</strong>
          <strong>OF THE GRID</strong>
        </span>
      </Link>

      <div className="sidebar-section-label">MISSION SYSTEMS</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            activeOptions={{ exact: true }}
            activeProps={{ 'data-status': 'active' }}
            className="sidebar-link"
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Overview' && <i className="sidebar-link-indicator" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {logoutError && <span className="logout-error" role="alert">Sign out failed. Try again.</span>}
        <button type="button" onClick={handleLogout} disabled={loggingOut} className="sidebar-logout">
          <LogOut size={18} />
          <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}
