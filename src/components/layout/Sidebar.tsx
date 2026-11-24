import { logout } from '#/lib/auth/auth.functions'
import {Link, useNavigate} from '@tanstack/react-router'
import {Activity, LayoutGrid, LogOut, type LucideIcon} from 'lucide-react'

type NavItem = {
  label: string
  icon: LucideIcon
  /** Only set for pages that already have a route. */
  to?: '/'
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: LayoutGrid, to: '/' },
]

// Icon-only items: the label lives in aria-label/title for screen readers and hover.
const itemClass =
  'flex size-12 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white'
const activeClass = 'bg-white/10 text-white'

export function Sidebar() {
    const navigate = useNavigate()

    async function handleLogout() {
      await logout()
      await navigate({ to: '/login' })
    }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" aria-label="Guardians of the Grid">
        <Activity className="size-7" strokeWidth={2} />
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon, to }) => {
          const icon = <Icon className="size-6" strokeWidth={1.5} />
          return to ? (
            <Link
              key={label}
              to={to}
              aria-label={label}
              title={label}
              className="sidebar-link"
              activeOptions={{ exact: true }}
              activeProps={{ 'data-status': 'active' }}
            >
              {icon}
            </Link>
          ) : (
            <button key={label} type="button" aria-label={label} title={label} className="sidebar-link">
              {icon}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
          className="sidebar-logout"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </aside>
  )
}
