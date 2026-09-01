/**
 * ThemeContext — gerencia temas do sistema e persiste no localStorage.
 * Injeta CSS custom properties direto no :root para aplicação global.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ── Temas pré-definidos ─────────────────────────────────────────
export const THEMES = {
  crimson: {
    id: 'crimson',
    name: 'RS Crimson',
    emoji: '🔴',
    primary: '#E11D48',
    primaryDark: '#9F1239',
    bg: '#000000',
    surface: '#0D0D0D',
    surface2: '#111111',
    surface3: '#1A1A1A',
    sidebar: '#0B0B0B',
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    isDark: true,
  },
  dark_purple: {
    id: 'dark_purple',
    name: 'Dark Purple',
    emoji: '🟣',
    primary: '#C30F45',
    primaryDark: '#231123',
    bg: '#0D0812',
    surface: '#130D1C',
    surface2: '#1A1025',
    surface3: '#22142E',
    sidebar: '#08050D',
    text: '#FFFFFF',
    textMuted: '#A89BB5',
    isDark: true,
  },
  electric_lemon: {
    id: 'electric_lemon',
    name: 'Lemonade Electric',
    emoji: '⚡',
    primary: '#B8FB3C',
    primaryDark: '#03045E',
    bg: '#020318',
    surface: '#040525',
    surface2: '#06072F',
    surface3: '#080939',
    sidebar: '#010214',
    text: '#FFFFFF',
    textMuted: '#8892B0',
    isDark: true,
  },
  neon_green: {
    id: 'neon_green',
    name: 'Neon Green',
    emoji: '🟢',
    primary: '#39FF14',
    primaryDark: '#1A7A00',
    bg: '#0B0B0B',
    surface: '#111111',
    surface2: '#161616',
    surface3: '#1C1C1C',
    sidebar: '#080808',
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    isDark: true,
  },
  electric_purple: {
    id: 'electric_purple',
    name: 'Electric Purple',
    emoji: '💜',
    primary: '#C200FB',
    primaryDark: '#5B0080',
    bg: '#06000F',
    surface: '#0D0018',
    surface2: '#120020',
    surface3: '#180028',
    sidebar: '#04000A',
    text: '#FFFFFF',
    textMuted: '#B39DC4',
    isDark: true,
  },
  electric_blue: {
    id: 'electric_blue',
    name: 'Electric Blue',
    emoji: '🔵',
    primary: '#0145F2',
    primaryDark: '#002699',
    bg: '#000000',
    surface: '#060C1A',
    surface2: '#0A1220',
    surface3: '#0E1826',
    sidebar: '#040810',
    text: '#FFFFFF',
    textMuted: '#8899BB',
    isDark: true,
  },
  white: {
    id: 'white',
    name: 'Branco',
    emoji: '☀️',
    primary: '#0145F2',
    primaryDark: '#0033CC',
    bg: '#EDF1F5',
    surface: '#FFFFFF',
    surface2: '#F5F7FA',
    surface3: '#E8ECF0',
    sidebar: '#E0E6EC',
    text: '#0A0A0A',
    textMuted: '#6B7280',
    isDark: false,
  },
}

const ThemeContext = createContext(null)

/** Aplica o tema como CSS custom properties no :root */
function applyTheme(theme) {
  const root = document.documentElement
  root.style.setProperty('--clr-primary',      theme.primary)
  root.style.setProperty('--clr-primary-dark',  theme.primaryDark)
  root.style.setProperty('--clr-bg',            theme.bg)
  root.style.setProperty('--clr-surface',       theme.surface)
  root.style.setProperty('--clr-surface-2',     theme.surface2)
  root.style.setProperty('--clr-surface-3',     theme.surface3)
  root.style.setProperty('--clr-sidebar',       theme.sidebar)
  root.style.setProperty('--clr-text',          theme.text)
  root.style.setProperty('--clr-text-muted',    theme.textMuted)
  root.style.setProperty('color-scheme', theme.isDark ? 'dark' : 'light')
  document.body.setAttribute('data-theme', theme.isDark ? 'dark' : 'light')
}

export function ThemeProvider({ children }) {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('rs-theme')) } catch { return null }
  })()

  const [activeId, setActiveId] = useState(saved?.id || 'crimson')
  const [customPrimary, setCustomPrimary]   = useState(saved?.customPrimary   || '#E11D48')
  const [customSecondary, setCustomSecondary] = useState(saved?.customSecondary || '#9F1239')

  const currentTheme = activeId === 'custom'
    ? { ...THEMES.crimson, id: 'custom', name: 'Personalizado', emoji: '🎨', primary: customPrimary, primaryDark: customSecondary }
    : (THEMES[activeId] || THEMES.crimson)

  useEffect(() => {
    applyTheme(currentTheme)
    localStorage.setItem('rs-theme', JSON.stringify({ id: activeId, customPrimary, customSecondary }))
  }, [activeId, customPrimary, customSecondary])

  const setTheme = useCallback((id) => setActiveId(id), [])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, activeId, setTheme, customPrimary, setCustomPrimary, customSecondary, setCustomSecondary }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
