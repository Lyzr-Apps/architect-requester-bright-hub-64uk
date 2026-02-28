'use client'

import { RiDashboardLine, RiListUnordered, RiAddCircleLine, RiSettings3Line, RiFilmLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'

type NavItem = 'dashboard' | 'requests' | 'new-request' | 'settings'

interface SidebarProps {
  activeSection: NavItem
  onNavigate: (section: NavItem) => void
}

const NAV_ITEMS: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <RiDashboardLine className="h-5 w-5" /> },
  { id: 'requests', label: 'Requests', icon: <RiListUnordered className="h-5 w-5" /> },
  { id: 'new-request', label: 'New Request', icon: <RiAddCircleLine className="h-5 w-5" /> },
  { id: 'settings', label: 'Settings', icon: <RiSettings3Line className="h-5 w-5" /> },
]

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-border" style={{ background: 'hsl(var(--sidebar-background))' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20">
          <RiFilmLine className="h-5 w-5 text-primary" />
        </div>
        <span className="hidden lg:block text-lg font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>MediaHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`justify-start gap-3 px-3 py-2.5 h-auto transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="hidden lg:block text-xs text-muted-foreground text-center" style={{ letterSpacing: '0.04em' }}>MediaHub v1.0</p>
        <div className="lg:hidden flex justify-center">
          <RiFilmLine className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  )
}
