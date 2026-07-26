export function NotFoundPage() {
  return (
    <main className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl">
      <section className="rounded-m border border-fg/15 p-xl text-center">
        <h1 className="font-display text-xl font-semibold">Diese Seite gibt es nicht.</h1>
        <a href="/" className="mt-l inline-flex rounded-m border border-fg/15 px-m py-s text-m hover:bg-surface">
          Zu den Kandidierenden
        </a>
      </section>
    </main>
  )
}
