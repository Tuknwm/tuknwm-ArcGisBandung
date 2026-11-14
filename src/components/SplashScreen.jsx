import { useEffect } from 'react'
import bandungName from '../assets/BandungName.png'
import bandungImg from '../assets/Bandung.png'

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-content">
        <img src={bandungImg} alt="" className="splash-img" />
        <img src={bandungName} alt="Bandung" className="splash-name" />
      </div>
    </div>
  )
}
