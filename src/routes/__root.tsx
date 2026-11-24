import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Sidebar } from '#/components/layout/Sidebar'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Control Center' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: AppLayout,
})

function AppLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const isLoginPage = useRouterState({
    select: (state) => state.location.pathname === '/login',
  })

  useEffect(() => {
    const saved = window.localStorage.getItem('htf-theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('htf-theme', theme)
  }, [theme])

  return (
    <div className="app-shell flex min-h-screen">
      {!isLoginPage && <Sidebar />}
      <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${theme === 'dark' ? 'white' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'white' : 'dark'} theme`}
          onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <main className={isLoginPage ? 'min-w-0 flex-1' : 'app-main'}>
        <Outlet />
      </main>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-app font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
