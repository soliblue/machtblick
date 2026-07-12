import { useId } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ThemeMode } from '@/hooks/useTheme'

type Props = {
  value: ThemeMode
  label: string
  lightLabel: string
  darkLabel: string
  onChange: (theme: ThemeMode) => void
  expanded?: boolean
}

function renderThemeOption({
  mode,
  title,
  Icon,
  index,
  expanded,
  value,
  name,
  onChange,
}: {
  mode: ThemeMode
  title: string
  Icon: typeof Sun
  index: number
  expanded: boolean
  value: ThemeMode
  name: string
  onChange: (theme: ThemeMode) => void
}) {
  return (
    <label
      key={mode}
      className={`relative flex min-w-0 items-center justify-center transition-colors ${index ? 'border-l border-fg/15' : ''} ${expanded ? 'h-[44px] flex-1 gap-s px-m text-m' : 'size-[32px]'} ${value === mode ? 'bg-fg font-semibold text-background' : 'hover:bg-surface'}`}
    >
      <input
        className={`absolute inset-0 z-10 m-0 cursor-pointer appearance-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ${value === mode ? 'focus-visible:outline-background' : 'focus-visible:outline-fg'}`}
        type="radio"
        name={name}
        value={mode}
        checked={value === mode}
        aria-checked={value === mode}
        aria-label={title}
        onChange={() => onChange(mode)}
      />
      <Icon size={expanded ? 17 : 14} aria-hidden="true" />
      {expanded ? <span>{title}</span> : null}
    </label>
  )
}

export function ThemePicker({ value, label, lightLabel, darkLabel, onChange, expanded = false }: Props) {
  const name = useId()
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className={`m-0 flex min-w-0 overflow-hidden rounded-m border p-0 text-s ${expanded ? 'w-full' : 'w-fit'}`}
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <legend className="sr-only">{label}</legend>
      {[
        { mode: 'light' as const, title: lightLabel, Icon: Sun },
        { mode: 'dark' as const, title: darkLabel, Icon: Moon },
      ].map(({ mode, title, Icon }, index) => {
        return expanded ? renderThemeOption({ mode, title, Icon, index, expanded, value, name, onChange }) : (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              {renderThemeOption({ mode, title, Icon, index, expanded, value, name, onChange })}
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>{title}</TooltipContent>
          </Tooltip>
        )
      })}
    </fieldset>
  )
}
