import ReactMarkdown from 'react-markdown'

type Props = { children: string }

export function Markdown({ children }: Props) {
  return (
    <div className="flex flex-col gap-m text-m">
      <ReactMarkdown
        skipHtml
        components={{
          h2: ({ children }) => <h2 className="mt-m text-l font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-s text-m font-semibold">{children}</h3>,
          p: ({ children }) => <p className="text-m">{children}</p>,
          ul: ({ children }) => <ul className="flex list-disc flex-col gap-s pl-l">{children}</ul>,
          ol: ({ children }) => <ol className="flex list-decimal flex-col gap-s pl-l">{children}</ol>,
          li: ({ children }) => <li className="text-m">{children}</li>,
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
