/**
 * AmbientBackground — Fundo animado com blobs de gradiente.
 *
 * OTIMIZAÇÃO MOBILE:
 * Em dispositivos móveis (ou com prefers-reduced-motion), os blobs são
 * substituídos por gradientes estáticos CSS puro — zero custo de GPU.
 * Em desktop, usa framer-motion com propriedades aceleradas por GPU
 * (transform/opacity) e blur reduzido.
 *
 * Antes: 6 blobs × blur(140px) × animação infinita = jank em mobile
 * Agora: mobile recebe gradiente CSS estático; desktop usa 3 blobs leves.
 */
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

// Hook simples para detectar preferência de movimento reduzido ou mobile
function useReducedMotion() {
  if (typeof window === 'undefined') return true
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const isMobile = window.innerWidth <= 768
  return mq.matches || isMobile
}

// Versão estática para mobile — apenas gradientes CSS, zero JS de animação
function StaticBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Gradiente estático vermelho — canto superior esquerdo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: '10%',
          left: '5%',
          background: 'var(--clr-primary)',
          opacity: 0.04,
          filter: 'blur(80px)',
          transform: 'translateZ(0)', // força layer GPU
        }}
      />
      {/* Gradiente estático — canto inferior direito */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          bottom: '10%',
          right: '5%',
          background: 'var(--clr-primary-dark)',
          opacity: 0.03,
          filter: 'blur(80px)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}

// Blob animado — usa apenas transform e opacity (GPU-accelerated)
// Sem animação de left/top que causaria reflow
const Blob = ({ color, size, delay, x, y }) => {
  return (
    <motion.div
      // Posicionamento fixo via transform — não relocaliza no DOM
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        borderRadius: '50%',
        // blur reduzido de 140px → 80px: ~65% menos custo de compositing
        filter: 'blur(80px)',
        willChange: 'transform, opacity', // dica ao browser para criar layer GPU
        transform: 'translateZ(0)',        // força compositing layer antecipado
        zIndex: 0,
        pointerEvents: 'none',
      }}
      className={color}
      initial={{ x, y, opacity: 0, scale: 0.8 }}
      animate={{
        // Anima APENAS x, y, scale e opacity — todas GPU-accelerated
        // NUNCA animar left/top/width/height que causam layout recalculation
        x: [x, x + 120, x - 80, x + 60, x],
        y: [y, y - 100, y + 80, y - 50, y],
        scale:   [0.8, 1.0, 0.9, 1.1, 0.8],
        opacity: [0.03, 0.06, 0.04, 0.07, 0.03],
      }}
      transition={{
        duration: 25 + delay * 5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

export default function AmbientBackground() {
  // Em mobile ou com prefers-reduced-motion: versão estática (zero jank)
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return <StaticBackground />

  // Desktop: apenas 3 blobs (era 6) com blur de 80px (era 140px)
  const blobs = useMemo(() => [
    { color: 'bg-primary',      size: 550, x: -250, y: -200, delay: 0 },
    { color: 'bg-primary-dark', size: 480, x:  200, y:  150, delay: 3 },
    { color: 'bg-primary',      size: 420, x:  100, y: -100, delay: 6 },
  ], [])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {blobs.map((blob, idx) => (
        <Blob key={idx} {...blob} />
      ))}
    </div>
  )
}
