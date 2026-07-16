# Hyperwrike Internal OS

Internal CRM & Business Management System for Hyperwrike (AI automation agency).

## Stack

- **Frontend:** Next.js 15 + React 19 + Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Local SQLite via Node.js built-in `node:sqlite` (stored at `data/hyperwrike.db`, requires Node 22+)
- **Auth:** Session-based (iron-session) + bcrypt password hashing

## Setup

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Seed Accounts

| Username | Password | Role |
|----------|----------|------|
| Peri | Peri@007 | CEO/Admin |
| Mounesh | Mounesh@007 | CTO/Admin |

> **Security:** These are dev credentials. Change passwords before any production deployment.

## Modules

1. **Auth & Roles** — CEO, CTO, Sales, Tech, Client portal roles
2. **CEO Dashboard** — Sales, cash flow, GST (18%), recurring payments, funnel, content
3. **Sales** — Call/email logging, pipeline Kanban, targets, strategy notes
4. **Client Management** — Client lifecycle tracker, portal account generation
5. **Documents** — SOW, Proposal, Contract, Invoice with auto GST calculation
6. **Projects & Tasks** — Kanban boards, team chat, activity logs, real-time sync
7. **Client Portal** — Live project progress, documents, invoices, updates
8. **Marketing** — Content calendar, SEO/AEO tracker, approval flow
9. **Team** — Employee account creation by CEO/CTO

## Skills & MCP

- `gsap-animation` skill (notedit/happy-skills) for Claude Code
- `taste-skill` (Leonxlnx/taste-skill) for design guidance
- 21st.dev MCP connector (HTTP transport)

## Design

Light theme with deep green accent (#10b981), DM Sans + Instrument Sans typography, Linear/Stripe-inspired dashboard cards.
