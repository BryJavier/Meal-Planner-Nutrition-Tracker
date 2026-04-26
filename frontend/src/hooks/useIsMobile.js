import { useEffect, useState } from 'react'

const MOBILE_BP = 640

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BP)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}
