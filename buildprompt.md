# Amana — Build Brief (for Claude Code / Codex)

You are helping build the MVP of **Amana** for a **48-hour hackathon** (the Monnify API is required). Read this whole brief. Then: **first confirm the tech stack and ask me for the credentials in "What I'll provide," and show me a short plan before you write any feature code.** Do not invent keys or endpoints.

---

## What Amana is
Cooperative societies pool members' savings and lend the money back out — but blindly: no scoring, manual notebooks, no visibility for members. **Amana digitises the cycle:** each member gets a dedicated virtual account for contributions, every payment is recorded transparently, and a **rule-based creditworthiness score** (from contribution + repayment behaviour) informs lending. Tagline: *"Turn trust into credit."*

## Scope — build EXACTLY this working core loop
The demo must show this happy path, end to end:
> Admin logs in → onboards a member (member gets a virtual account) → a contribution is simulated (ledger + score update) → member requests a loan → system shows a **score-based decision + a plain-language explanation** → admin disburses → confirmation.

**MUST build:**
- Admin auth with a **mocked email OTP** (see "Authentication & onboarding") — built **last**; during core-loop dev use a seeded admin / dev bypass so nothing is blocked.
- Onboard member → create **Monnify Reserved Account** (mock BVN in sandbox).
- **Webhook receiver** → record contributions/repayments (verify signature, idempotent).
- **Rule-based scoring engine** (formula below).
- Loan: request → score-based eligibility → admin approve → **disburse via Monnify Single Transfer** (idempotent, unique reference).
- Repayment recording → score recompute.
- Admin dashboard: members list, member detail (score + breakdown + ledger), loan actions.

**Do NOT build (explicitly out of scope — do not add these):**
- Any ML model — scoring is **rule-based only**.
- Direct Debit, Card Tokenisation, bank-facing credit export.
- Production-grade RBAC / multi-tenant hardening.
- Real paid BVN/NIN live calls — **mock in sandbox**.

**The differentiator (build immediately after the core loop — this is what lifts Amana above a basic CRUD app):**
- The AI **behavioural credit analyst** — see the AI layer section.

**Nice-to-have (only if time remains):**
- Offline Pay-ins (cash contribution); a member-facing view; natural-language ledger query.

## Tech stack (confirm with me first)
Default unless I say otherwise: **Node + Express** backend · **PostgreSQL** (or SQLite for speed) via **Prisma** · **React (Vite)** frontend with **Tailwind + shadcn/ui** · one hosted **LLM API** for the AI layer · deployable on Render/Railway/Vercel.

## Data model (core entities)
- **Cooperative**(id, name, admin_user_id, contribution_amount, cycle, max_loan_multiple)
- **User**(id, role[admin|member], name, phone, password_hash)
- **Member**(id, cooperative_id, user_id, bvn_status, join_date, status)
- **VirtualAccount**(id, member_id, monnify_account_reference, account_number, bank_name)
- **Contribution**(id, member_id, amount, paid_at, monnify_txn_ref, status)
- **Loan**(id, member_id, principal, status[requested|approved|disbursed|repaying|closed|defaulted], score_at_decision, breakdown_json, disbursement_ref, created_at)
- **Repayment**(id, loan_id, amount, due_date, paid_at, status)
- **WebhookLog**(id, monnify_ref, event_type, payload_json, processed_at) — for idempotency + audit

## Internal API endpoints
- `POST /auth/login`
- `POST /members` (onboard: KYC + reserve account) · `GET /members` · `GET /members/:id`
- `POST /webhooks/monnify` (verify → match → record → rescore)
- `GET /members/:id/contributions` · `GET /members/:id/score`
- `POST /loans` (request) · `POST /loans/:id/approve` · `POST /loans/:id/disburse` · `GET /loans`
- `POST /loans/:id/repay` · `GET /loans/:id/explanation`
- `POST /assistant/query` (nice-to-have)

## Monnify integration (SANDBOX)
- Base URL: `https://sandbox.monnify.com`.
- **Confirm exact endpoint paths and request/response field names against `developers.monnify.com/api` — that is the source of truth over any shape described here.**
- **Auth:** exchange API Key + Secret (Basic auth, base64 of `key:secret`) at the login endpoint for a bearer token; use `Bearer` on all other calls.
- **Reserved Accounts:** create one per member at onboarding (BVN mocked in sandbox).
- **Single Transfer:** disburse loans — **unique reference per loan, idempotent, never double-pay.**
- **Webhooks:** verify the **SHA-512 signature** with the secret key before trusting an event; dedupe via `WebhookLog`. Prefer webhooks over polling for final status.
- Sandbox disbursement has **OTP on by default** — I will get it disabled; assume headless disbursement.

## Scoring engine (rule-based & transparent — implement exactly)
Score **0–100**, weighted:
| Factor | Weight |
|---|---|
| Repayment reliability (on-time repayment rate) | 40% |
| Contribution consistency (on-time / expected) | 30% |
| Membership tenure (capped, e.g. 24 months = full) | 15% |
| Savings depth (total contributed / balance) | 15% |

**Thin-file rule** (no loan history yet): drop the repayment factor; redistribute → contribution **50%**, tenure **25%**, savings **25%**; label the score *"Provisional."*

**Score → max loan** (then subtract outstanding balance):
`80–100 → 3× savings · 60–79 → 2× · 40–59 → 1× · <40 → not eligible`

Every score returns a **per-factor breakdown** (for display + the AI explanation). Keep this logic in **one isolated, unit-tested module.**

## AI layer — the differentiator (behavioural credit analyst)
Not a narrator of the score — a **behavioural credit analyst** on top of it. Given a member's raw contribution and repayment history (timing, amounts, gaps, how fast they recover after a missed payment, trend direction), it surfaces signals a weighted formula can't and **flags risk early** — e.g. *"Consistent payer; always catches up within ~3 days of a miss — resilience signal,"* or *"Contributions slowing over the last month — flag for early intervention before default."*
- The **rule-based score stays the transparent, auditable backbone**; the AI reads between the lines on top of it.
- It also **explains each loan decision** in plain language (optionally Pidgin/Yoruba) and answers natural-language questions about a member/ledger.
- **Honest & grounded:** behavioural *analysis over real data*, NOT a trained ML model (no training data exists — a faked model is the "slop" to avoid). It answers ONLY from data passed to it; pass the computed score in — it must never invent one.

## Design
Clean, minimal, content-first fintech (Cowrywise register). Tailwind + shadcn/ui, **Inter** font, **tabular figures** for money/scores, one calm primary colour + green/amber-red for status, card-based layout, generous whitespace. No decoration.

## Authentication & onboarding (build LAST — after the core loop runs)
Two separate "verifications" — do not conflate them:

- **Admin login OTP — mocked.** Email/password sign-in with an email verification code, but the code is a **fixed demo value behind a `DEMO_MODE` env flag**. Show a visible hint on screen: *"Didn't get the email? Use 123456."* Accept `123456`, and **label it in the code as a deliberate stub** — a judge reading the repo should see it's intentional, not a security hole. **Do NOT build real email delivery** (no SendGrid/Twilio — no time). During core-loop dev, use a seeded admin or a dev bypass so login never blocks you; wrap this gate on at the end.
- **Member onboarding — a proper, complete verified flow.** Collect the member's details → run the KYC/verification step → issue the reserved account → mark them verified. The verification call is **mocked in sandbox** (BVN/NIN are live-only; you may use Name Enquiry, which works in sandbox, for real account-name validation). The *flow* is real and complete; only the BVN check underneath is stubbed, and it flips to a real check post-hackathon with one swap.

**Sequencing:** both are built **last**. The admin login is just a door and earns no demo points; the onboarding flow is part of Amana's value story — put the realism there.

## Engineering practices (non-negotiable)
- Secrets in **env vars only**; commit a `.env.example`, never real keys; `.gitignore` `.env` and `node_modules`.
- Webhook signature verification · idempotent transfers · sensible error/partial-failure handling · clean, documented repo.
- Scoring logic isolated and unit-tested.

## Build order (keep it runnable at each step)
1. Repo scaffold + env setup + data model/migrations + seed an admin.
2. Monnify auth + create reserved account (onboard a member end-to-end).
3. Webhook receiver → record a contribution → recompute score.
4. Scoring module + member detail showing score + breakdown.
5. Loan flow: request → decision → approve → disburse (idempotent) → repayment → rescore.
6. Admin dashboard tying it together.
7. **The AI behavioural analyst** (the differentiator — see AI layer).
8. **Wrap the auth gate** — real login flow with the `DEMO_MODE` 123456 OTP, and finalise the onboarding verification UX.
9. (If time) Offline Pay-ins; member view; natural-language ledger query.

## What I'll provide (ask me — do not invent)
- Monnify sandbox **API Key, Secret Key, Contract Code**.
- My chosen **LLM provider + key** (for the AI layer).
- **Stack confirmation** (or give me your recommendation and proceed once I approve).

## Definition of done
The happy path above runs in sandbox; the repo is clean with a working local setup guide; **no secrets committed.** Nice-to-haves may be stubbed — **prioritise a working core loop over breadth.**

---
**Now:** confirm the stack, ask me for the sandbox keys, and show me your build plan before writing feature code.