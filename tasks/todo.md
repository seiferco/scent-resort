# ScentResort MVP - Task Tracker

## Phase 1: Foundation — COMPLETE
- [x] Finalize architecture plan
- [x] Set up monorepo (npm workspaces: frontend, backend, shared)
- [x] Define shared TypeScript types and constants
- [x] Build Express backend (config, middleware, routes, services)
- [x] Build Next.js frontend (pages, components, auth, API wrapper)
- [x] Define Firestore schema (Users, Listings, Transactions, Reports)
- [x] Implement Stripe Connect escrow flow (separate charges + transfers)
- [x] Implement Stripe Identity KYC seller gating
- [x] Build report/takedown system (flag counting, auto-hide at 3)
- [x] Create admin dashboard (flagged listings, disputes, ban)

## Phase 2: Integration & Testing — TODO
- [ ] Configure Firebase project and add credentials to .env.local
- [ ] Configure Stripe account (Connect + Identity) and add keys
- [ ] Integrate Stripe Elements on frontend for payment UI
- [ ] Integrate Stripe Identity modal on frontend for KYC UI
- [ ] Set up cron job for inspection window expiration
- [ ] Write Firestore security rules
- [ ] End-to-end testing of all trust features
- [ ] Deploy to Vercel (frontend) and hosting (backend)
