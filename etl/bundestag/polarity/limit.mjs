export function pLimit(concurrency) {
  const queue = []
  let active = 0
  const next = () => {
    if (active >= concurrency || !queue.length) return
    active++
    const { fn, resolve, reject } = queue.shift()
    fn().then(resolve, reject).finally(() => {
      active--
      next()
    })
  }
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject })
      next()
    })
}
