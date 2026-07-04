import ReactMarkdown from 'react-markdown'
import { SERIF } from './fonts'

type Props = { children: string; serif?: boolean }

export function Markdown({ children, serif = false }: Props) {
  const bodyStyle = serif ? { fontFamily: SERIF } : undefined
  const bodyClass = serif ? 'text-m leading-[1.45]' : 'text-m'
  return (
    <div className="flex flex-col gap-m text-m">
      <ReactMarkdown
        skipHtml
        components={{
          h2: ({ children }) => serif
            ? <h2 className="mt-m text-s caption opacity-l">{children}</h2>
            : <h2 className="mt-m text-l font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-s text-m font-semibold">{children}</h3>,
          p: ({ children }) => <p className={bodyClass} style={bodyStyle}>{children}</p>,
          ul: ({ children }) => <ul className="flex list-disc flex-col gap-s pl-l">{children}</ul>,
          ol: ({ children }) => <ol className="flex list-decimal flex-col gap-s pl-l">{children}</ol>,
          li: ({ children }) => <li className={bodyClass} style={bodyStyle}>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline">
              {children}
            </a>
          ),
          img: () => null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
