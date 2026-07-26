import { useId } from 'react'
import { Moon, Sun } from 'lucide-react'

export type ThemeMode = 'light' | 'dark'

type Props = {
  value: ThemeMode
  label: string
  lightLabel: string
  darkLabel: string
  onChange: (theme: ThemeMode) => void
  expanded?: boolean
}

export function ThemePicker({
  value,
  label,
  lightLabel,
  darkLabel,
  onChange,
  expanded = false,
}: Props) {
  const name = useId()
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className={`mb-theme-picker ${expanded ? 'mb-theme-picker--expanded' : ''}`}
    >
      <legend className="mb-visually-hidden">{label}</legend>
      {[
        { mode: 'light' as const, title: lightLabel, Icon: Sun },
        { mode: 'dark' as const, title: darkLabel, Icon: Moon },
      ].map(({ mode, title, Icon }) => (
        <label
          key={mode}
          title={expanded ? undefined : title}
          className={`mb-theme-picker__option ${value === mode ? 'mb-theme-picker__option--selected' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={mode}
            checked={value === mode}
            aria-label={title}
            onChange={() => onChange(mode)}
          />
          <Icon aria-hidden="true" size={expanded ? 17 : 14} />
          {expanded ? <span>{title}</span> : null}
        </label>
      ))}
    </fieldset>
  )
}
