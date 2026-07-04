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
    <div className="flex w-[112px] shrink-0 flex-col gap-xs desk:w-[128px]">
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="h-[112px] w-[112px] object-cover desk:h-[128px] desk:w-[128px]" />
      ) : (
        <div className="flex h-[112px] w-[112px] items-center justify-center bg-surface text-xl font-semibold opacity-m desk:h-[128px] desk:w-[128px]">
          {initials(name)}
        </div>
      )}
      {pictureUrl && pictureAuthor && pictureLicense && (
        <div
          className="w-full truncate text-[10px] opacity-l"
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
