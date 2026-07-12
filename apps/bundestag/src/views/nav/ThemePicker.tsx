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
  const options = [
    { mode: 'system' as const, title: systemLabel, Icon: Monitor },
    { mode: 'light' as const, title: lightLabel, Icon: Sun },
    { mode: 'dark' as const, title: darkLabel, Icon: Moon },
  ]
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className="m-0 flex min-w-0 overflow-hidden rounded-m border p-0 text-s"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <legend className="sr-only">{label}</legend>
      {options.map(({ mode, title, Icon }, i) => (
        <label key={mode} className={`${optionClass}${i ? ' border-l border-fg/15' : ''} ${value === mode ? 'bg-surface opacity-100' : 'opacity-l'}`} title={title}>
          <input className={inputClass} type="radio" name={name} value={mode} checked={value === mode} onChange={() => onChange(mode)} aria-label={title} />
          <Icon size={14} aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  )
}
