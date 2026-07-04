import type { ComponentType, SVGProps } from 'react'
import { Info } from 'lucide-react'
import { Link } from '../../lib/Link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Tile = {
  label: string
  value: string
  icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  to?: string
  params?: Record<string, string>
  search?: Record<string, string>
  info?: string
  onClick?: () => void
  active?: boolean
}
type Props = { tiles: Tile[] }

export function StatTiles({ tiles }: Props) {
  return (
    <div className="grid grid-cols-2 gap-l sm:grid-cols-4">
      {tiles.map((t) => {
        const Icon = t.icon
        const inner = (
          <>
            <div className="flex items-center gap-xs text-s caption opacity-l">
              {Icon && <Icon size={14} />}
              <span>{t.label}</span>
              {t.info && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Info"
                      className="opacity-l hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                    >
                      <Info size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent style={{ width: 'min(320px, 90vw)' }}>{t.info}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="mt-xs text-xl font-semibold">{t.value}</div>
          </>
        )
        const activeStyle = t.active
          ? { background: 'var(--color-surface)', boxShadow: 'inset 0 -2px 0 var(--color-danger)' }
          : undefined
        return t.to ? (
          <Link
            key={t.label}
            to={t.to}
            params={t.params}
            search={t.search}
            className="block transition-opacity hover:opacity-80"
          >
            {inner}
          </Link>
        ) : t.onClick ? (
          <button
            key={t.label}
            type="button"
            onClick={t.onClick}
            className="block w-full text-left transition-opacity hover:opacity-80"
            style={activeStyle}
          >
            {inner}
          </button>
        ) : (
          <div key={t.label}>{inner}</div>
        )
      })}
    </div>
  )
}
