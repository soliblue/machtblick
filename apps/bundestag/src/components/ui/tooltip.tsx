"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function useIsTouch() {
  const [touch, setTouch] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)")
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return touch
}

type Ctx = {
  touch: boolean
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}
const TooltipCtx = React.createContext<Ctx>({
  touch: false,
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
})

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const touch = useIsTouch()
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )
  React.useEffect(() => {
    if (!touch || !currentOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t?.closest("[data-slot=tooltip-trigger]")) return
      if (t?.closest("[data-slot=tooltip-content]")) return
      setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("scroll", close, true)
    }
  }, [touch, currentOpen, setOpen])
  return (
    <TooltipCtx.Provider value={{ touch, open: currentOpen, setOpen, triggerRef }}>
      {touch ? (
        <TooltipPrimitive.Root data-slot="tooltip" open={currentOpen} onOpenChange={setOpen} {...props} />
      ) : (
        <TooltipPrimitive.Root data-slot="tooltip" open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} {...props} />
      )}
    </TooltipCtx.Provider>
  )
}

function TooltipTrigger({
  onClick,
  ref: forwardedRef,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { touch, open, setOpen, triggerRef } = React.useContext(TooltipCtx)
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      typeof forwardedRef === "function"
        ? forwardedRef(node)
        : forwardedRef && ((forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node)
    },
    [forwardedRef, triggerRef],
  )
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      ref={setRef}
      onClick={(e) => {
        if (touch && !open) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }
        onClick?.(e)
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  collisionPadding = 8,
  style,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const { touch, open, setOpen, triggerRef } = React.useContext(TooltipCtx)
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        onClick={(e) => {
          if (touch && open) {
            const target = e.target as Element | null
            const interactive = target?.closest("a,button,input,select,textarea,[role=button],[role=link]")
            if (!interactive) {
              const trigger = triggerRef.current
              const anchor = trigger?.tagName === "A" ? (trigger as HTMLAnchorElement) : trigger?.querySelector("a")
              anchor?.click()
              setOpen(false)
            }
          }
          onClick?.(e)
        }}
        className={cn(
          "z-50 w-fit min-w-0 origin-(--radix-tooltip-content-transform-origin) animate-in border bg-background px-3 py-2 text-xs text-balance text-foreground shadow-lg backdrop-blur fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        style={{
          maxWidth: "min(320px, calc(100vw - 16px), var(--radix-tooltip-content-available-width))",
          overflowWrap: "anywhere",
          ...style,
        }}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 border-r border-b bg-background fill-background" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider }
