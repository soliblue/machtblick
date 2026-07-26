type Props = {
  publisher: string
  url: string
}

export function CandidateSourceNotice({ publisher, url }: Props) {
  return (
    <div className="mt-l rounded-m bg-surface p-m text-s">
      Die Angaben in diesem Profil basieren auf der veröffentlichten{' '}
      <a href={url} target="_blank" rel="noreferrer" className="underline">
        Originalquelle von {publisher}
      </a>
      .
    </div>
  )
}
