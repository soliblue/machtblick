import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props<T extends string> = {
  label: string
  options: readonly T[]
  value: T | null
  onChange: (value: T | null) => void
  formatOption?: (option: T) => string
  resetLabel?: string
}

export function FilterPill<T extends string>({
  label,
  options,
  value,
  onChange,
  formatOption = (option) => option,
  resetLabel = `${label} zurücksetzen`,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const pillRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    if (open && pillRef.current) {
      const bounds = pillRef.current.getBoundingClientRect()
      setPosition({ left: bounds.left, top: bounds.bottom + 4 })
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const closeOutside = (event: MouseEvent) => {
        if (
          !pillRef.current?.contains(event.target as Node)
          && !menuRef.current?.contains(event.target as Node)
        ) {
          setOpen(false)
        }
      }
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false)
          buttonRef.current?.focus()
        }
      }
      const closeOnViewportChange = () => setOpen(false)
      document.addEventListener('mousedown', closeOutside)
      document.addEventListener('keydown', closeOnEscape)
      window.addEventListener('scroll', closeOnViewportChange, true)
      window.addEventListener('resize', closeOnViewportChange)
      return () => {
        document.removeEventListener('mousedown', closeOutside)
        document.removeEventListener('keydown', closeOnEscape)
        window.removeEventListener('scroll', closeOnViewportChange, true)
        window.removeEventListener('resize', closeOnViewportChange)
      }
    }
  }, [open])

  return (
    <>
      <span
        ref={pillRef}
        className={`mb-filter-pill ${value === null ? '' : 'mb-filter-pill--active'}`}
      >
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="mb-filter-pill__trigger"
          onClick={() => setOpen((current) => !current)}
        >
          {value === null ? label : <strong>{formatOption(value)}</strong>}
        </button>
        {value === null ? null : (
          <button
            type="button"
            aria-label={resetLabel}
            className="mb-filter-pill__reset"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            ×
          </button>
        )}
      </span>
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              className="mb-filter-pill__menu"
              style={{ left: position.left, top: position.top }}
            >
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  className="mb-filter-pill__option"
                  onClick={() => {
                    onChange(option === value ? null : option)
                    setOpen(false)
                  }}
                >
                  {formatOption(option)}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
