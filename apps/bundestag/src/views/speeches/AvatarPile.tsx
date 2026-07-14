import { withLocale } from '@/lib/locale'
import { useLocale } from '@/lib/i18n'
import { SpeakerAvatar } from './SpeakerAvatar'

export type AvatarPilePerson = {
  id: string
  name: string
  pictureUrl: string | null
}

type Props = {
  people: AvatarPilePerson[]
  cap?: number
}

export function AvatarPile({ people, cap = 8 }: Props) {
  const locale = useLocale()
  const visible = people.slice(0, cap)
  const overflow = Math.max(0, people.length - cap)
  return people.length ? (
    <div className="flex items-center">
      {visible.map((person, index) => (
        <a
          key={person.id}
          href={withLocale(`/members/${person.id}/`, locale)}
          aria-label={person.name}
          className="inline-flex rounded-full border border-background hover:opacity-80"
          style={{ marginLeft: index ? -10 : 0, zIndex: visible.length - index }}
        >
          <SpeakerAvatar name={person.name} pictureUrl={person.pictureUrl} size={32} />
        </a>
      ))}
      {overflow > 0 && (
        <span
          className="flex items-center justify-center rounded-full border border-background bg-surface text-s font-semibold opacity-l"
          style={{ width: 32, height: 32, marginLeft: -10 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  ) : null
}
