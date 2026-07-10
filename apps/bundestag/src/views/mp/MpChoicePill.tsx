type Choice = 'ja' | 'nein' | 'enthalten' | 'nicht_abgegeben'

const STYLE: Record<Exclude<Choice, 'nicht_abgegeben'>, { background: string; color: string }> = {
  ja: { background: 'var(--color-success)', color: 'var(--color-background)' },
  nein: { background: 'var(--color-danger)', color: 'var(--color-background)' },
  enthalten: { background: 'var(--color-yellow)', color: 'var(--color-fg)' },
}

const LABEL: Record<Choice, string> = { ja: 'Ja', nein: 'Nein', enthalten: 'Enthaltung', nicht_abgegeben: 'Abwesend' }

export function MpChoicePill({ choice }: { choice: Choice }) {
  return choice === 'nicht_abgegeben' ? (
    <span className="text-s caption opacity-m">{LABEL.nicht_abgegeben}</span>
  ) : (
    <span className="w-fit whitespace-nowrap px-s py-[2px] text-[11px] font-semibold caption" style={STYLE[choice]}>
      {LABEL[choice]}
    </span>
  )
}
