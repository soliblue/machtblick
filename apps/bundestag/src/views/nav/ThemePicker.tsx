import { useId } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemeMode } from '@/hooks/useTheme'

type Props = {
  value: ThemeMode
  label: string
  systemLabel: string
  lightLabel: string
  darkLabel: string
  onChange: (theme: ThemeMode) => void
}

const optionClass = 'relative flex size-[32px] items-center justify-center transition-colors hover:bg-surface hover:opacity-100'
const inputClass = 'absolute inset-0 z-10 cursor-pointer appearance-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg'

export function ThemePicker({ value, label, systemLabel, lightLabel, darkLabel, onChange }: Props) {
  const name = useId()
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className="m-0 flex min-w-0 overflow-hidden rounded-m border p-0 text-s"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <legend className="sr-only">{label}</legend>
      <label className={`${optionClass} ${value === 'system' ? 'bg-surface opacity-100' : 'opacity-l'}`} title={systemLabel}>
        <input className={inputClass} type="radio" name={name} value="system" checked={value === 'system'} onChange={() => onChange('system')} aria-label={systemLabel} />
        <Monitor size={14} aria-hidden="true" />
      </label>
      <label className={`${optionClass} border-l border-fg/15 ${value === 'light' ? 'bg-surface opacity-100' : 'opacity-l'}`} title={lightLabel}>
        <input className={inputClass} type="radio" name={name} value="light" checked={value === 'light'} onChange={() => onChange('light')} aria-label={lightLabel} />
        <Sun size={14} aria-hidden="true" />
      </label>
      <label className={`${optionClass} border-l border-fg/15 ${value === 'dark' ? 'bg-surface opacity-100' : 'opacity-l'}`} title={darkLabel}>
        <input className={inputClass} type="radio" name={name} value="dark" checked={value === 'dark'} onChange={() => onChange('dark')} aria-label={darkLabel} />
        <Moon size={14} aria-hidden="true" />
      </label>
    </fieldset>
  )
}
