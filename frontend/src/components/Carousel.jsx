import { useEffect, useState, useRef } from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Carousel({ images = [], interval = 3500, className = '' }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!images || images.length <= 1) return
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, interval)
    return () => clearInterval(timerRef.current)
  }, [images, interval])

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className={cx('relative w-full h-full overflow-hidden', className)}>
      {images.map((img, idx) => (
        <img
          key={img.url || idx}
          src={img.url || img}
          alt="carousel"
          className={cx(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            idx === index ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute left-1/2 bottom-3 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} className={cx('h-2 w-8 rounded-full transition-opacity', i === index ? 'bg-white/90' : 'bg-white/40 opacity-60')} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  )
}
