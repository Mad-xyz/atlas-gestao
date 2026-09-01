// Resumo: Barra inferior de navegação para mobile com atalhos principais.
import React from 'react'
import { Calendar, ClipboardCheck, Home, User, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',           icon: Home,           label: 'Inicio'   },
  { to: '/attendance', icon: ClipboardCheck, label: 'Chamada'  },
  { to: '/students',   icon: Users,          label: 'Alunos'   },
  { to: '/events',     icon: Calendar,       label: 'Eventos'  },
  { to: '/profile',    icon: User,           label: 'Perfil'   },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 safe-area-inset-bottom">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className="flex-1 h-full">
          {({ isActive }) => (
            <span className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-all">
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ background: 'linear-gradient(90deg, var(--clr-primary-dark), var(--clr-primary))', boxShadow: '0 0 8px color-mix(in srgb, var(--clr-primary) 60%, transparent)' }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.7}
                color={isActive ? 'var(--clr-primary)' : '#6B7280'}
                style={{ transition: 'color 0.2s' }}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? 'var(--clr-primary)' : '#6B7280' }}
              >
                {label}
              </span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
