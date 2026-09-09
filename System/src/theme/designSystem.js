/**
 * Atlas Academy — Design System
 * ============================
 * Fonte de verdade para todas as decisões visuais do app.
 * Baseado no reference: Atlas Academy.html
 *
 * USO: importe os tokens que precisar em seus componentes.
 * As classes Tailwind equivalentes estão listadas como comentário.
 */

// ─── Typography ───────────────────────────────────────────────────────────────
export const fonts = {
  heading: "'Bebas Neue', cursive",   // text-display (headings, KPI values, page titles)
  body:    "'Inter', system-ui, sans-serif", // text-sans (body, labels, inputs)
};

/** Classes Tailwind para tipografia */
export const typography = {
  pageTitle:    "font-['Bebas_Neue'] text-3xl md:text-4xl tracking-wide text-white",
  sectionTitle: "font-['Bebas_Neue'] text-xl tracking-wide text-white",
  kpiValue:     "font-['Bebas_Neue'] text-4xl md:text-5xl text-white leading-none",
  kpiLabel:     "text-xs font-semibold uppercase tracking-wider text-gray-400",
  body:         "font-['Inter'] text-sm text-gray-300",
  bodyMuted:    "font-['Inter'] text-sm text-gray-500",
  label:        "text-xs font-semibold uppercase tracking-wider text-gray-400",
};

// ─── Border Radius ─────────────────────────────────────────────────────────────
/**
 * Rounding padrão: rounded-xl (12px) para cards, inputs, botões.
 * Aderente ao "estilo antigo" que o usuário aprovou.
 */
export const radius = {
  card:    'rounded-2xl',  // 16px — containers, modais, cards
  button:  'rounded-xl',   // 12px — botões primários e secundários (User requested 12px)
  input:   'rounded-2xl',  // 16px — campos de formulário
  badge:   'rounded-full', // pill — badges, tags, status indicators
  inner:   'rounded-lg',   // 8px  — elementos internos de card
};

// ─── Colors ────────────────────────────────────────────────────────────────────
export const colors = {
  primary:       'var(--clr-primary)',       // Crimson #E11D48
  primaryDark:   'var(--clr-primary-dark)',  // Burgundy #9F1239
  bg:            'var(--clr-bg)',
  surface:       'var(--clr-surface)',
  surface2:      'var(--clr-surface-2)',
  surface3:      'var(--clr-surface-3)',
  text:          'var(--clr-text)',
  muted:         'var(--clr-text-muted)',
};

// ─── Glass / Surface Tokens ────────────────────────────────────────────────────
/** Classes Tailwind para surfaces glassmorphism */
export const surfaces = {
  glass:     'bg-white/5 border border-white/10 backdrop-blur-xl',
  glassHover:'hover:bg-white/8 hover:border-white/20 transition-all duration-200',
  card:      'bg-white/[0.03] border border-white/10',
  cardHover: 'hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer',
  input:     'bg-white/7 border border-white/14 text-white placeholder-gray-600',
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────
/** Classes Tailwind para KPI cards com hover vermelho */
export const kpiCard = {
  base:    `rounded-xl p-4 border border-white/10 bg-white/[0.03] transition-all duration-200 cursor-pointer`,
  hover:   `hover:border-primary/50 hover:bg-primary/[0.04] hover:shadow-lg hover:shadow-primary/10`,
  active:  `border-primary/60 bg-primary/[0.06] shadow-md shadow-primary/15`,
  icon:    `w-10 h-10 rounded-lg flex items-center justify-center`,
  value:   `font-sans text-4xl leading-none text-white mt-2 font-black`,
  label:   `text-xs uppercase tracking-wider text-gray-400 font-semibold`,
  desc:    `text-xs text-gray-500 mt-1`,
};

// ─── Buttons ───────────────────────────────────────────────────────────────────
export const buttons = {
  primary:    `bg-gradient-to-br from-[#9F1239] to-[#E11D48] text-white font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]`,
  secondary:  `bg-white/8 border border-white/15 text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 hover:bg-white/12 hover:border-white/25`,
  danger:     `bg-red-950/60 border border-red-500/30 text-red-400 font-medium rounded-xl px-5 py-2.5 transition-all duration-200 hover:bg-red-900/50`,
  ghost:      `text-gray-400 font-medium rounded-xl px-4 py-2 transition-all duration-200 hover:bg-white/5 hover:text-white`,
  iconButton: `p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white`,
};

// ─── Inputs ────────────────────────────────────────────────────────────────────
export const inputs = {
  base:     `w-full bg-white/7 border border-white/14 rounded-2xl px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none transition-all duration-200`,
  focus:    `focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.12)]`,
  select:   `w-full bg-white/7 border border-white/14 rounded-2xl px-4 py-2.5 text-white text-sm outline-none transition-all duration-200 cursor-pointer`,
};

// ─── Animations ────────────────────────────────────────────────────────────────
/** Variantes para Framer Motion */
export const motionVariants = {
  fadeSlideUp: {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  fadeIn: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },
  slideInRight: {
    hidden:  { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.07 } },
  },
  scaleIn: {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  },
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
export const modal = {
  backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`,
  container: `relative w-full max-w-2xl bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden`,
  header:   `flex items-center justify-between px-6 py-4 border-b border-white/10`,
  title:    `font-sans text-2xl tracking-wide text-white font-black`,
  body:     `px-6 py-5 overflow-y-auto`,
  footer:   `px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3`,
  close:    `p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors`,
};

// ─── Table ─────────────────────────────────────────────────────────────────────
export const table = {
  wrapper:    `rounded-2xl border border-white/10 overflow-hidden`,
  header:     `bg-white/[0.03] border-b border-white/10`,
  headerCell: `px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 text-left`,
  row:        `border-b border-white/5 transition-colors hover:bg-white/[0.02]`,
  cell:       `px-4 py-3 text-sm text-gray-300`,
};

// ─── Page Layout ───────────────────────────────────────────────────────────────
export const layout = {
  page:    `p-4 md:p-6 max-w-7xl mx-auto space-y-5`,
  grid2:   `grid grid-cols-1 md:grid-cols-2 gap-4`,
  grid3:   `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`,
  grid4:   `grid grid-cols-2 md:grid-cols-4 gap-4`,
  section: `space-y-3`,
};

// ─── Status / Badges ───────────────────────────────────────────────────────────
export const badges = {
  active:   `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`,
  inactive: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20`,
  danger:   `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20`,
  warning:  `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20`,
  info:     `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20`,
  primary:  `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20`,
};

export default {
  fonts,
  typography,
  radius,
  colors,
  surfaces,
  kpiCard,
  buttons,
  inputs,
  modal,
  table,
  layout,
  badges,
  motionVariants,
};
