import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { BrandWordmark } from './BrandWordmark'

export type ProductArea = 'Bundestag' | 'Berlin'

type Props = {
  current: ProductArea
  bundestagHref?: string
  animateBrand?: boolean
}

export function ProductPicker({ current, bundestagHref = 'https://machtblick.de', animateBrand = true }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const products: { label: ProductArea; href: string }[] = [
    { label: 'Bundestag', href: bundestagHref },
    { label: 'Berlin', href: 'https://berlin.machtblick.de' },
  ]

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false
        detailsRef.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className="mb-product-picker">
      <a className="mb-product-picker__brand" href={bundestagHref} aria-label="Machtblick">
        <BrandWordmark animated={animateBrand} />
      </a>
      <span className="mb-product-picker__divider" aria-hidden="true" />
      <details ref={detailsRef} className="mb-product-picker__details">
        <summary className="mb-product-picker__summary">
          <span>{current}</span>
          <ChevronDown aria-hidden="true" size={14} strokeWidth={1.5} />
        </summary>
        <div className="mb-product-picker__menu">
          {products.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              aria-current={current === label ? 'page' : undefined}
              className="mb-product-picker__option"
            >
              {label}
            </a>
          ))}
        </div>
      </details>
    </div>
  )
}
