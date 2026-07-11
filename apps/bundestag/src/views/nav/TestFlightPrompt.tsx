import { useRef } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

type Props = {
  visible: boolean
  title: string
  description: string
  actionLabel: string
  dismissLabel: string
  closeLabel: string
  onDismiss: () => void
}

export function TestFlightPrompt({ visible, title, description, actionLabel, dismissLabel, closeLabel, onDismiss }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <DialogPrimitive.Root open={visible} onOpenChange={(open) => open ? undefined : onDismiss()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <DialogPrimitive.Content
          ref={contentRef}
          tabIndex={-1}
          className="fixed bottom-l left-1/2 z-[61] w-[calc(100%-32px)] max-w-[360px] -translate-x-1/2 rounded-l bg-background p-l shadow-2xl focus:outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            contentRef.current?.focus()
          }}
        >
          <img src="/machtblick-ios-app.png" alt="" width={56} height={56} className="size-[56px] rounded-m" />
          <DialogPrimitive.Title className="mt-m pr-xl font-display text-xl font-semibold">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-s text-m opacity-l">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-l flex flex-col gap-s">
            <a
              href="https://testflight.apple.com/join/r7RVrgtr"
              className="rounded-m bg-fg px-l py-m text-center text-m font-semibold text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {actionLabel}
            </a>
            <DialogPrimitive.Close className="rounded-m px-l py-s text-m opacity-l hover:bg-surface hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              {dismissLabel}
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute right-m top-m flex size-[32px] items-center justify-center rounded-full bg-surface opacity-l hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X size={17} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
