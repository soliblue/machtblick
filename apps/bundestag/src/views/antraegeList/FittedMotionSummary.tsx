import { SERIF } from '@/lib/fonts'
import { useFittedLineClamp } from '@/hooks/useFittedLineClamp'

type Props = {
  children: string
}

export function FittedMotionSummary({ children }: Props) {
  const { ref, lines } = useFittedLineClamp<HTMLDivElement>()
  return (
    <div ref={ref} className="relative mt-m min-h-0 flex-1 overflow-hidden text-m leading-[1.45]">
      <p
        className="absolute inset-0"
        style={{
          fontFamily: SERIF,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: lines ?? undefined,
          maxHeight: 'round(down, 100%, 1lh)',
          overflow: 'hidden',
        }}
      >
        {children}
      </p>
    </div>
  )
}
