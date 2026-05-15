import { initials } from '@/lib/initials'
import { useCopy } from '@/lib/i18n'

type Props = {
  name: string
  pictureUrl: string | null
  pictureAuthor: string | null
  pictureLicense: string | null
  pictureSourceUrl: string | null
}

export function MemberPortrait({ name, pictureUrl, pictureAuthor, pictureLicense, pictureSourceUrl }: Props) {
  const t = useCopy()
  return (
    <div className="flex shrink-0 flex-col gap-xs">
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="h-[120px] w-[120px] rounded-full object-cover" />
      ) : (
        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-surface text-xxl font-semibold opacity-l">
          {initials(name)}
        </div>
      )}
      {pictureUrl && pictureAuthor && pictureLicense && (
        <div
          className="w-[120px] truncate text-[10px] opacity-l"
          title={`${t.photo}: ${pictureAuthor}, ${pictureLicense}`}
        >
          {t.photo}:{' '}
          <a href={pictureSourceUrl ?? '#'} target="_blank" rel="noreferrer" className="underline">
            {pictureAuthor}
          </a>
          , {pictureLicense}
        </div>
      )}
    </div>
  )
}
