# 106 · Speech unification (one entry anatomy, two context modes, one reader)

Note: the number 106 is also used by `106-default-namentlich-vote-filter.md`; kept as
instructed, do not create further 106s.

## Goal

Speeches are rendered in three dialects today:

1. `/speeches` feed: `SpeechCard` (card, circular photo, name, party logo, ballot
   stance pill, serif excerpt, expand-in-place).
2. Member detail Reden tab: `MemberSpeechGroupRow` (title-first group row, hairline
   dividers, expandable timeline with bare name/text rows).
3. Vote detail Reden tab: `PartySummaryPreviewList` (per-Fraktion AI summary rows,
   stance chips, modal) + `DebateList` (chronological rows via `SpeechRow`, presidium
   moderation rows as full rows, expand-in-place).

Unify to ONE speech-entry anatomy with TWO context modes:

- **individual** (feed, member tab, search): standalone item; carries its own context
  (vote link or debate topic, date, ballot stance).
- **conversation** (vote detail debate): chronological thread; order and speaker turns
  carry meaning; presidium rows are structural connective tissue, not content.

Plus ONE shared expanded-speech mechanism (today: expand-in-place on the feed, modal
on vote detail), and a home for the per-Fraktion AI summaries (they summarize the
conversation, so they are the conversation's header layer).

## Shared entry anatomy (identical in both prototypes)

Header grid `[36px 1fr auto]`: circular photo 36 (initials fallback) | name text-m
semibold + PartyLogo 16 (or role sub-line text-s caps opacity-l for ministers) |
VoteChoicePill right when the speaker's ballot is known. Individual mode adds a
context line (text-s opacity-l): `Zur Abstimmung: <link>` or `Debatte: <topic>`.
Body: Charter serif text-m leading 1.45, clamp 4. Footer affordance `Ganze Rede
lesen` text-s opacity-l + chevron. Card wrapper (white background, hairline border,
double shadow, radius 0, padding l) only in individual mode.

Both prototypes share this entry; they differ in the conversation surface, the
summary layer, and the expand mechanism.

## Version A: "Protokoll" (quiet archive)

Prototype `/tmp/speech-unify/a.html`, shots `a-{feed,summaries,thread,expanded}.png`,
`a-expanded-mid.png` (390x844).

Thesis: a debate is a document. The vote's Reden tab is one continuous transcript;
you unfold it where you stand.

- **Summary layer** = the document's abstract: one hairline-bordered block, one row
  per Fraktion (logo 20 + DAFÜR/DAGEGEN chip + chevron right, 2-line serif clamp),
  all five visible at once, ordered by PARTY_ORDER. Tap expands the Langfassung in
  place.
- **Thread**: no cards, no dividers; turns separated by xl whitespace. Turn header
  = entry anatomy at avatar 28. Presidium rows shrink to centered stage directions:
  caption `PRÄSIDENTIN KLÖCKNER` (s caps fg@40) over the verbatim line in serif
  italic s fg@70, no avatar. Zwischenfragen indent xl under a `ZWISCHENFRAGE`
  micro-caption; one-line replies ("Sehr gerne.") render compact: avatar 20 +
  `Ploß:` + serif text inline. Skipped runs collapse to a centered hairline row
  `3 WEITERE WORTMELDUNGEN` (real count).
- **Expand mechanism: in place, everywhere.** Feed cards, thread turns, member
  groups, and Fraktion summaries all unfold where they are. While open, a sticky
  (bottom xl) `Einklappen` pill floats over the text (same visual as the mobile
  filter pill) so a reader deep in a 4,000-character speech can always get out.

Strengths: calm, archival, honest; smallest delta from current code (expand-in-place
already exists); all five Fraktion positions visible at a glance; zero new overlay
machinery. Weaknesses: a fully expanded speech mid-thread destroys the turn-taking
rhythm (the conversation disappears while one voice is unfolded); deep in an expanded
text the speaker header is off-screen; stage directions, while elegant, de-emphasize
who is being asked what.

## Version B: "Wortgefecht" (conversation-first)

Prototype `/tmp/speech-unify/b.html`, shots `b-{feed,summaries,thread,expanded}.png`.

Thesis: a debate is people answering each other. The thread should read like a
dialogue, and reading a whole speech is a mode switch.

- **Spine**: a vertical hairline; every turn's circular avatar sits on it. Avatars
  of ballot-casting speakers get a 2px ring in success/danger, so the sides of the
  debate are visible before reading a word (ring = stance, never party). Turn
  header/body = entry anatomy, no card.
- **Presidium as system messages**: small hollow dot on the spine + one sans line
  `Präsidentin Klöckner · <verbatim text>` (text-s opacity-l), like a chat's
  connective tissue. Gap rows use the same dot idiom.
- **Zwischenfragen as nested turns**: grid `[28px 1fr]` indented m off the spine
  under a `ZWISCHENFRAGE` caption; short replies are compact spine rows
  (`Ploß · Nein, ich bin viel zu jung dafür.`).
- **Summary layer**: horizontal swipe strip of per-Fraktion cards (240px, logo +
  stance chip + 5-line serif clamp + `Zusammenfassung lesen`), the conversation's
  header chapter.
- **Expand mechanism: one Reader sheet.** Bottom sheet (mobile) / centered panel
  42rem (desktop): drag handle, entry header, meta line (date · vote link), full
  text serif text-l (16) scrollable, footer `Wortmeldung 1 von 26` +
  `Nächste: Dr. Thomas Gebhart`. The SAME Reader opens from feed cards, member
  groups, thread turns, and Fraktion summaries (killing PartySummaryModal); in
  thread context prev/next lets you read straight through the debate.

Strengths: the debate FEELS like debate; stance rings + nesting surface the story
(who attacks, who defends, who interjects) at a glance; the Reader solves the
long-text-in-a-list problem and unifies speech + summary expansion into one
mechanism with debate navigation. Weaknesses: more new surface (spine, Reader,
strip); the strip hides 3 of 5 Fraktion positions off-screen; rings risk being
misread as party color (mitigated: ring colors are only ever success/danger).

## Recommendation

**B, with A's summary layer.** The thread spine, system-message presidium rows,
nested Zwischenfragen, and the Reader sheet are the version that makes a debate
legible as a debate, and the Reader is the cleaner unification: one mechanism
replaces both expand-in-place and the modal, and gains prev/next debate reading for
free. But B's horizontal strip loses the at-a-glance "who stood where"; A's stacked
abstract block (all five Fraktionen, stance chips aligned) is the better header
layer and should open the same Reader instead of expanding in place. A's sticky
`Einklappen` pill dies with expand-in-place; A's stage-direction styling is the
fallback if the spine proves too busy in implementation.

## Implementation notes (who merges, who dies)

- New `SpeechEntry` (views/speeches/, shared): header + context line + serif body +
  affordance; props `mode: 'card' | 'turn'`, `stance`, `context`. Replaces
  `SpeechCard` AND `SpeechRow` (both die).
- New `DebateThread` replaces `DebateList` internals: spine, SystemRow (presidium),
  nested turn (Zwischenfrage), gap-collapse row, keeps the search input + Pager
  (or grows "load more"; pagination across a conversation is awkward, flag for
  lead). Ballot map and `useSpeechBody` unchanged.
- New `Reader` (one component): mobile bottom sheet / desktop centered panel,
  reuses `PartySummaryModal`'s focus-trap/scroll-lock logic, renders either a
  speech (via `useSpeechBody`, ids array) or a Fraktion summary (position, key
  points, dissent note, AI notice). `PartySummaryModal` dies.
- `PartySummaryPreviewList`: keep row structure (A abstract styling: bordered
  block, all five rows), rows open Reader.
- `MemberSpeechGroupRow`: group header (title, date, n Beiträge, vote link) stays;
  the expanded timeline renders conversation-mode `SpeechEntry` turns with the same
  system-row treatment for presidium context rows; full text opens Reader.
- Feed `/speeches`: card mode entries, tap opens Reader (expand-in-place dies).
  Reader prev/next on the feed navigates feed order or is omitted (lead call).
- Data flag for plumber/backend: the thread needs a nesting signal for
  Zwischenfragen. Today `contributionType` is only speech/short; nesting in the
  prototypes was derived by hand. Materialize a `nested`/`replyTo` signal in ETL
  (presidium question + speaker alternation heuristic), do not regex it in the view.
- Prototype data is real: vote `2025-12-04-982-antrag-zur-besteuerung-von-luxusflugen`
  (Ploß/Al-Wazir/Wagner Zwischenfrage sequence, Klöckner moderation), feed items
  from 2026-06-25, all texts/summaries pulled from :5174 static data.

## Tokens

Text: xxl unused; xl 22 only the vote title (Fraunces); l 16 only the Reader body
(serif); m 14 names + bodies; s 12 captions, context lines, system rows, affordances.
Weights regular/semibold only. Spacing xs/s/m/l/xl as annotated (turn separation xl,
nesting indent m/xl). Radius 0 everywhere; circles only avatars + floating pills +
spine dots. Colors: success/danger on stance pills and avatar rings, yellow reserved
for Enthaltung; party color only in logos; borders fg@15, secondary text fg@70/40.
Components: Card recipe, Badge-like stance chip (existing VoteChoicePill), Input,
Tabs, Tooltip unchanged; Reader is the one new primitive (a decision, flagged).

## Log

- 2026-07-05 designer: inventoried the three dialects (screenshots
  `/tmp/speech-unify/cur-*.png`), built both prototypes with real data
  (`/tmp/speech-unify/{a,b}.html`, builder `build.py`), iterated twice
  (fixed truncated shard text, presidium attribution, nested-question layout,
  sticky collapse pill), shot `{a,b}-{feed,summaries,thread,expanded}.png` at
  390x844. Recommendation: B with A's summary layer. No implementation, no commit.
- 2026-07-05 frontend: implemented B + amendments (see "Implemented" above). Verified
  with Playwright on :5174 at 390x844 and 1440x900, de + en: feed entry anatomy +
  Reader prev/next/Escape, member Reden tab timeline thread + Reader, Luxusflüge vote
  (`2025-12-04-982-antrag-zur-besteuerung-von-luxusflugen`) summary strip with stamps +
  spine + 5 system rows + 2 nested Zwischenfragen on page 1 + summary/speech Readers
  (`Wortmeldung 1 von 36`), zero console errors. tsc clean. Screenshots
  `/tmp/speech-unify/impl-{feed,thread,thread-top,reader,reader-summary}.png`.
  Not committed.

## RESOLVED (user, 2026-07-05)
Version B ("Wortgefecht") chosen, combined with A's stacked summary layer per designer recommendation. User amendments to B's entry anatomy:
1. Row 1: speaker name only. Row 2 (below name): party logo + vote/stance.
2. The speech text moves close to the spine: it starts directly after the avatar column and uses the full remaining width (more room for the text).
3. Stance rendered as colored TEXT ("Ja" in success green, "Nein" in danger), NOT background fills or avatar rings; the color-everywhere treatment was too much.
Implement across all speech surfaces: /speeches feed, member detail Reden tab, vote detail Reden tab (A-style summary layer + B thread), one SpeechEntry + one Reader replacing SpeechCard/SpeechRow/PartySummaryModal. Zwischenfrage nesting by heuristic for now; ETL contributionType signal is a plumber follow-up.

## AMENDED during implementation (user via lead, 2026-07-05)

1. Summary layer on vote detail is B's HORIZONTAL scroll strip after all, not A's stacked
   list: one 240px card per Fraktion, non-wrapping momentum scroll (filter-pill idiom),
   logo + stance + 5-line serif clamp + `Zusammenfassung lesen`, tap opens Reader.
2. Stance on the summary cards renders as a STAMP (Stamp component, straight
   `rotated={false}`, size s), right-aligned on the card's top row (logo left, stamp
   right). Stamp gained four stance variants `dafuer/dagegen/enthalten/gespalten`
   (success/danger/yellow/fg) labeled via `stanceLabels`, both locales.
3. Summary cards have NO drop shadow: hairline border only.

## Implemented (frontend, 2026-07-05)

New shared home `apps/bundestag/src/views/speeches/`:

- `SpeechEntry.tsx`: one entry anatomy, `mode: 'card' | 'turn'` + `nested`. Row 1 name
  only, row 2 party logo + stance as colored text (no fills, no rings), serif body
  clamp-4, `Ganze Rede lesen` affordance; card mode adds wrapper + vote link.
- `DebateThread.tsx`: spine container (hairline at 17px, content at pl-48 so text sits
  directly after the avatar column at full width), maps thread rows.
- `SystemRow.tsx`: presidium system message (hollow dot on spine, `Name · text`, s/70).
- `CompactTurnRow.tsx`: short interjections (`Ploß · Sehr gerne.`, avatar 28 on spine).
- `Reader.tsx`: bottom sheet (mobile) / centered 42rem panel (desk), focus-trapped +
  Escape per FilterSheet, renders speech (via `useSpeechBody`, serif text-l) or Fraktion
  summary (position/keyPoints/dissent/AI notice), footer `Wortmeldung i von n` +
  `Nächste: <name>` prev/next.
- `SpeakerAvatar.tsx`, `StanceText.tsx` (+ `Stance`, `CHOICE_STANCE`).

Hooks: `hooks/debateThread.ts` (presidium detection by speakerRole, Zwischenfrage
nesting heuristic: turn by non-floor speaker is nested iff floor speaker returns within
the next 2 non-presidium turns; `contributionType === 'short'` → compact),
`hooks/useReader.ts` (index state, prev/next).

Rewired: `redenSearch/RedenSearch.tsx` (card entries + feed-order Reader),
`memberDetail/MemberSpeechGroupRow.tsx` (group header kept; expanded timeline is a
conversation-mode thread + Reader; avatars via `useSpeechPeople` from
`MemberSpeechesSection`), `voteDetail/DebateList.tsx` (strip + `Verlauf der Debatte`
thread, search + Pager kept, rows paged 15/page, two readers: summaries and turns),
`voteDetail/PartySummaryPreviewList.tsx` (horizontal strip per amendment),
`votesList/Stamp.tsx` (stance variants). i18n keys added: zwischenfrage,
debateTimeline, contributionOf, nextLabel, previousLabel, readSummary, groupsCount.

Killed: `redenSearch/SpeechCard.tsx`, `redenSearch/SpeechRow.tsx`,
`voteDetail/PartySummaryModal.tsx`. Kept exports stable: `DebateList` (SpeechesTab +
AntragDetail), `SummaryRow`/`PartySummary` now exported from
`PartySummaryPreviewList`.

Open for plumber: materialize the Zwischenfrage nesting signal in ETL (replace the
view-side heuristic). Open for lead: pagination across a conversation is still a Pager
(15 thread rows/page); "load more" would read better.
