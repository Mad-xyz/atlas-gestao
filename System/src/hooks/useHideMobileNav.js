import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Hook to automatically hide/show the mobile bottom navigation bar based on a boolean state.
 * @param {boolean} isOpen - Whether the overlay/modal is open.
 */
export function useHideMobileNav(isOpen) {
  const { setIsMobileNavHidden } = useApp()

  useEffect(() => {
    if (!isOpen) return

    const hideNav = () => {
      setIsMobileNavHidden(true)
      document.body.style.overflow = 'hidden'
    }

    const showNav = () => {
      setIsMobileNavHidden(false)
      document.body.style.overflow = ''
    }

    hideNav()

    return () => {
      showNav()
    }
  }, [isOpen, setIsMobileNavHidden])
}




