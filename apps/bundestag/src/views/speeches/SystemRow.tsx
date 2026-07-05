type Props = { speakerName: string; text: string }

export function SystemRow({ speakerName, text }: Props) {
  return (
    <div className="relative mt-l text-s opacity-l">
      <span
        className="absolute -left-[34px] top-[5px] h-[7px] w-[7px] rounded-full border border-fg/15 bg-elevated"
        aria-hidden="true"
      />
      <span className="font-semibold">{speakerName}</span> · {text}
    </div>
  )
}
