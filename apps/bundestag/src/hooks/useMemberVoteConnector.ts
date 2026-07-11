import { useEffect, useRef, useState } from 'react'

type Geometry = { width: number; height: number; path: string; breakPath: string }

export function useMemberVoteConnector() {
  const containerRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  useEffect(() => {
    const update = () => {
      const container = containerRef.current?.getBoundingClientRect()
      const status = statusRef.current?.getBoundingClientRect()
      const target = targetRef.current?.getBoundingClientRect()
      if (container && status && target) {
        const targetX = target.left + target.width / 2 - container.left
        const targetY = target.top - container.top - 4
        const startX = status.left + status.width / 2 - container.left
        const startY = status.bottom - container.top
        const bendY = startY + Math.max(8, Math.min(16, (targetY - startY) / 2))
        const firstLength = bendY - startY
        const middleLength = Math.abs(targetX - startX)
        const midpoint = (firstLength + middleLength + targetY - bendY) / 2
        const breakOnMiddle = midpoint > firstLength && midpoint <= firstLength + middleLength
        const breakX = breakOnMiddle
          ? startX + Math.sign(targetX - startX) * (midpoint - firstLength)
          : midpoint <= firstLength ? startX : targetX
        const breakY = breakOnMiddle
          ? bendY
          : midpoint <= firstLength ? startY + midpoint : bendY + midpoint - firstLength - middleLength
        setGeometry({
          width: container.width,
          height: container.height,
          path: `M ${startX} ${startY} V ${bendY} H ${targetX} V ${targetY}`,
          breakPath: `M ${breakX + 1.5} ${breakY - 4} L ${breakX - 2} ${breakY - 0.5} H ${breakX + 1} L ${breakX - 1.5} ${breakY + 4}`,
        })
      }
    }
    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)
    if (statusRef.current) observer.observe(statusRef.current)
    if (targetRef.current) observer.observe(targetRef.current)
    update()
    return () => observer.disconnect()
  }, [])
  return { containerRef, statusRef, targetRef, geometry }
}
