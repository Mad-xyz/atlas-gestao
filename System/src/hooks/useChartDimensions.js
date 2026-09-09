import { useState, useEffect, useRef } from 'react'

export function useChartDimensions() {
  const ref = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const measure = () => {
      if (!ref.current) return
      const { offsetWidth, offsetHeight } = ref.current
      
      if (offsetWidth > 0 && offsetHeight > 0 && (offsetWidth !== dimensions.width || offsetHeight !== dimensions.height)) {
        setDimensions({ width: offsetWidth, height: offsetHeight })
        setIsReady(true)
      } else if (offsetWidth === 0 || offsetHeight === 0) {
        setIsReady(false)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [dimensions.width, dimensions.height])

  return { ref, dimensions, isReady }
}