import { initials } from '@/lib/initials'

type Props = { name: string; pictureUrl?: string | null; size?: number }

export function SpeakerAvatar({ name, pictureUrl = null, size = 36 }: Props) {
  return pictureUrl ? (
    <img src={pictureUrl} alt="" className="rounded-full bg-background object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  )
}
