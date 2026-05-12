export function StampFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="stamp-grunge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" result="displaced" />
          <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="7" result="holes" />
          <feColorMatrix in="holes" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.0" result="mask" />
          <feComposite in="displaced" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
