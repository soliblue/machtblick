import { SpeakerAvatar } from './SpeakerAvatar'
import { SERIF } from '@/lib/fonts'
import type { SpeechEntrySpeech } from './SpeechEntry'

type Props = { speech: SpeechEntrySpeech; pictureUrl?: string | null; onOpen: () => void }

export function CompactTurnRow({ speech, pictureUrl = null, onOpen }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="relative mt-l cursor-pointer"
    >
      <span className="absolute -left-[44px] top-0">
        <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} size={28} />
      </span>
      <div className="text-m">
        <span className="font-semibold">{speech.speakerName.split(' ').pop()}</span>
        <span className="opacity-l"> · </span>
        <span style={{ fontFamily: SERIF, lineHeight: 1.45 }}>{speech.excerpt}</span>
      </div>
    </div>
  )
}
