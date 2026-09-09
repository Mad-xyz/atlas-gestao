/**
 * useThemeVars — retorna as CSS vars atuais como strings JS.
 * Qualquer componente importa isto e usa nas inline styles.
 * Assim todo o app reage ao tema sem precisar de Tailwind dinâmico.
 */
import { useTheme } from '../context/ThemeContext'

export function useThemeVars() {
  const { theme } = useTheme()
  return {
    primary:      theme.primary,
    primaryDark:  theme.primaryDark,
    bg:           theme.bg,
    surface:      theme.surface,
    surface2:     theme.surface2,
    surface3:     theme.surface3,
    sidebar:      theme.sidebar,
    text:         theme.text,
    textMuted:    theme.textMuted,
    isDark:       theme.isDark,

    // Helpers de cor com opacidade (hex + alpha)
    primaryAlpha: (a) => `${theme.primary}${Math.round(a * 255).toString(16).padStart(2, '0')}`,
    darkAlpha:    (a) => `${theme.primaryDark}${Math.round(a * 255).toString(16).padStart(2, '0')}`,

    // CSS var strings for use in style={{ color: vars.CSS.primary }}
    CSS: {
      primary:      'var(--clr-primary)',
      primaryDark:  'var(--clr-primary-dark)',
      bg:           'var(--clr-bg)',
      surface:      'var(--clr-surface)',
      surface2:     'var(--clr-surface-2)',
      surface3:     'var(--clr-surface-3)',
      sidebar:      'var(--clr-sidebar)',
      text:         'var(--clr-text)',
      textMuted:    'var(--clr-text-muted)',
    },
  }
}
