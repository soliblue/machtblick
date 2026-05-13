import ReactMarkdown from 'react-markdown'

type Props = { children: string }

export function MarkdownInline({ children }: Props) {
  return (
    <ReactMarkdown
      skipHtml
      allowedElements={['strong', 'em', 'a', 'p']}
      unwrapDisallowed
      components={{
        p: ({ children }) => <>{children}</>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="underline">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
