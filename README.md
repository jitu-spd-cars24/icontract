# Zycus iContract — AI-Native Contract Authoring (Prototype)

A clickable, end-to-end redesign of the **Contract Authoring** experience for Zycus
iContract, built as a **configurable hybrid workspace** (Cursor × Notion × Word × Salesforce)
with **Merlin** as a proactive enterprise co-pilot — not a chatbot.

**Stack:** React + TypeScript + Vite + Tailwind v4 + hand-authored shadcn-style components.
No backend — realistic mock data drives live, stateful interactions.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checked production build
```

> Best viewed at ≥1280px wide — the workspace is a true three-panel layout.

## Demo path (≈3 min)

1. **Dashboard** — Merlin daily briefing, recent contracts with health scores, "Resume draft".
2. **New contract → Generate with Merlin Intake** — conversational intake; answer via
   suggestion chips. Metadata fills live on the right. The final question (signer) is
   **skippable** → marked *Missing*, never blocking.
3. **Review metadata** — grouped fields with confidence pills (Auto / Manual / Review /
   Missing), a confidence overview, and Merlin's detected issues (currency mismatch, missing
   jurisdiction, duplicate supplier, missing signer) with one-click fixes.
4. **Choose a template** — ranked with match scores, "why recommended", and edge-case flags
   (US-default jurisdiction needs localisation).
5. **Generate draft** — staged loading (template → data → clauses → policy → compliance → risk).
6. **Workspace (centerpiece)** — three panels:
   - **Left:** health score, section nav, and a live document outline (risk-dotted).
   - **Center:** the document as **clause cards** — status + risk badges, non-standard /
     approved flags, owners, inline Merlin insights, **variant swapping** (Standard / fallback
     / custom), and version history.
   - **Right — Merlin co-pilot:** tabs for Insights, Generate, Rewrite, Compare, Explain,
     Risk, History. Proactive: *"I found 2 risks and 2 missing clauses."*
7. **Try:** *Apply fix* on a risk → watch the health score, risk counts, outline dots, and
   badges update across every panel. *Draft & insert* a missing DPA clause → **streamed** AI
   text. *Rewrite* a clause (Simplify / Legal / Business / Shorten / Expand / Translate).
8. **Submit for approval** — readiness gate (health-scored checklist) → routing (with
   negotiation prediction + on-leave delegate handling) → **e-sign handoff**.

## Key product decisions

- **Panel-first, not wizard-first.** The document is always primary; structure lives left,
  intelligence lives right. Panels collapse/expand; selections sync across all three.
- **Merlin is proactive and accountable.** Every consequential suggestion shows *what*, *why*,
  *policy basis*, *confidence %*, and explicit Apply / Compare / Explain / Ignore / Escalate.
  Nothing legal changes silently; AI-drafted clauses are flagged for review.
- **Non-blocking by design.** Missing info is surfaced, never a hard stop — progress is
  preserved with clear "Missing / Needs review" states.
- **Health score replaces a blind "Submit".** Approval readiness is a transparent, gated
  checklist tied to live contract state.

## Structure

```
src/
  lib/          types, mock data (contract, clauses, metadata, insights, approvers…), utils
  store.tsx     app state machine + mutations (apply variant, resolve insight, insert clause…)
  components/   ui/primitives, shared atoms, TopBar
  screens/      Dashboard, StartingPoint, MerlinIntake, MetadataReview, TemplateSelection, GenerateDraft
  screens/workspace/  Workspace, LeftRail, DocumentCanvas, ClauseCard, MerlinPanel, CenterViews, ApprovalModal
```

Dark mode, keyboard-focusable controls, and WCAG-minded color tokens are built in
(toggle theme from the top bar).
