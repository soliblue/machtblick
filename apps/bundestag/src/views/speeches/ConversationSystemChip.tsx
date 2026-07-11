type Props = {
  speakerName: string
  text: string
}

export function ConversationSystemChip({ speakerName, text }: Props) {
  return (
    <div className="my-l flex items-center gap-m py-s text-s opacity-l">
      <span className="h-px min-w-xl flex-1 bg-fg/15" aria-hidden="true" />
      <div className="max-w-[28rem] text-left">
        <span className="font-semibold">{speakerName}</span>
        <span className="opacity-l"> · </span>
        <span>{text}</span>
      </div>
      <span className="h-px min-w-xl flex-1 bg-fg/15" aria-hidden="true" />
    </div>
  )
}
