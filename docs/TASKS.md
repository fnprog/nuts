# Budget Tracker — Technical Specification

---

## 🏷️ Project Name Ideas
Pick one or come up with yours: **Cedi** / **Kasu** / **Nkran** / **Float**

---

## 🎯 Goal
A personal finance app for Android + Web that auto-logs transactions from MoMo/bank SMS, works fully offline, and gives forward-looking insights — built with React Native + Expo, Supabase, and Claude API.

---

## 🗂️ Project Structure

```
/app                  → Expo Router screens (mobile + web)
/components           → Shared UI components
/features             → Feature modules (transactions, budgets, goals)
/lib                  → Supabase client, Claude API, WatermelonDB setup
/db                   → WatermelonDB models + schema
/modules/sms          → Native Android SMS listener module
/hooks                → Custom React hooks
/store                → Zustand global state
/utils                → Helpers, formatters, validators
/assets               → Fonts, icons, images
```

---

## 🗄️ Database Schema

### Tables (WatermelonDB local + Supabase cloud mirror)

**users**
- id, email, display_name, currency (default: GHS), created_at

**transactions**
- id, user_id, amount, currency, merchant, category_id, note, source (manual | sms | voice | ocr), raw_sms, date, created_at, synced

**categories**
- id, user_id, name, icon, color, is_income (bool), created_at

**envelopes** (budget buckets)
- id, user_id, category_id, amount_limit, period (monthly | weekly | custom), rollover (bool), created_at

**goals**
- id, user_id, name, target_amount, current_amount, deadline, icon, created_at

**sms_rules**
- id, user_id, pattern, merchant_name, category_id, created_at

**bill_reminders**
- id, user_id, name, amount, due_day, recurrence, last_paid, created_at

---

## 📱 Screens / Routes

```
/ (tabs)
  /dashboard          → Home — net balance, envelopes summary, recent transactions
  /transactions       → Full transaction list + search + filter
  /budgets            → Envelope view + edit
  /insights           → Forecasting, charts, patterns
  /goals              → Savings goals with progress bars

/transaction/new      → Quick add form
/transaction/[id]     → Edit single transaction
/budget/new           → Create envelope
/goal/new             → Create savings goal
/settings             → Profile, categories, SMS rules, export, security
/onboarding           → 3-screen setup flow
```

---

## ⚙️ Core Systems

### SMS Parser Pipeline
```
Incoming SMS → Android Native Module captures it
→ Regex pre-filter (is this a financial SMS?)
→ If yes → send to Claude API with parsing prompt
→ Claude returns { merchant, amount, type, date, raw }
→ Validate with Zod
→ Write to WatermelonDB as pending transaction
→ Show approval card on dashboard
→ User taps confirm → mark as confirmed, queue for Supabase sync
```

### Offline Sync Pipeline
```
App opens / comes online
→ WatermelonDB checks unsynced records
→ Push unsynced transactions to Supabase
→ Pull any changes from other devices
→ Resolve conflicts (last-write-wins for now)
→ Update local DB
```

### AI Categorization
```
New transaction comes in (any source)
→ Check sms_rules table first (exact match = instant category)
→ If no rule → send to Claude with user's category list
→ Claude returns best category + confidence score
→ If confidence > 90% → auto-assign
→ If confidence < 90% → flag for user review
→ User corrects → save as new sms_rule for next time
```

---

## 🔌 External Services & Keys Needed

| Service | Purpose | Where to get |
|---|---|---|
| Supabase | Auth + cloud DB + storage | supabase.com |
| Claude API | SMS parsing, categorization, insights | console.anthropic.com |
| OpenAI Whisper | Voice-to-text | platform.openai.com |
| Google ML Kit | On-device receipt OCR | Free via Expo plugin |
| Expo EAS | Build + deploy | expo.dev |

---

## ✅ Task List by Phase

---

### PHASE 0 — Setup (Day 1)
- [ ] Create Expo project with TypeScript template
- [ ] Install and configure Expo Router
- [ ] Set up NativeWind (Tailwind for RN)
- [ ] Set up ESLint + Prettier + TypeScript strict mode
- [ ] Create Supabase project, copy keys to `.env`
- [ ] Set up Supabase Auth (email + Google)
- [ ] Initialize WatermelonDB with SQLite adapter
- [ ] Define all DB models and schema in WatermelonDB
- [ ] Mirror schema in Supabase (same tables)
- [ ] Set up Zustand store skeleton
- [ ] Create `/lib/supabase.ts` and `/lib/claude.ts` clients
- [ ] Push to GitHub, set up basic CI

---

### PHASE 1 — Core Transaction Flow (Week 1)
- [ ] Build onboarding screens (name, currency, income type)
- [ ] Build dashboard screen skeleton with dummy data
- [ ] Build quick-add transaction form (amount, merchant, category, date)
- [ ] Build transaction list screen with search and filter
- [ ] Build edit/delete transaction screen
- [ ] Implement category CRUD (create, edit, delete)
- [ ] Wire up WatermelonDB — save and read transactions locally
- [ ] Write Zod schemas for transaction validation
- [ ] Add currency formatter utility (GHS, USD, etc.)
- [ ] Add date formatter and relative time ("2 hours ago")

---

### PHASE 2 — SMS + AI Parsing (Week 2)
- [ ] Write Android native module to listen for incoming SMS
- [ ] Write regex pre-filter to detect financial SMS (MoMo, bank patterns)
- [ ] Write Claude API prompt for SMS parsing (return structured JSON)
- [ ] Test parsing with 20+ real MoMo/bank SMS samples
- [ ] Build "pending approval" card component on dashboard
- [ ] Handle approve / dismiss / edit on parsed transactions
- [ ] Save confirmed SMS parse as sms_rule for future auto-matching
- [ ] Handle duplicate detection (same SMS parsed twice)
- [ ] Add background fetch so SMS parsing works when app is closed
- [ ] Write Claude AI categorization prompt
- [ ] Implement confidence threshold logic (auto-assign vs flag)
- [ ] Build "correct this category" flow that saves new rule

---

### PHASE 3 — Budgets & Envelopes (Week 3)
- [ ] Build envelope/budget list screen
- [ ] Build create/edit envelope form (name, limit, period, rollover)
- [ ] Calculate envelope spending from transactions automatically
- [ ] Show remaining vs spent per envelope with progress bar
- [ ] Implement rollover logic at period end
- [ ] Build "move money between envelopes" feature
- [ ] Build bill reminders CRUD
- [ ] Set up local push notifications for bill due dates
- [ ] Income pattern detection (weekly vs monthly vs irregular)
- [ ] Adapt budget period to detected income pattern

---

### PHASE 4 — Offline Sync (Week 3–4)
- [ ] Implement sync queue — track all unsynced records
- [ ] Build push sync (local → Supabase on reconnect)
- [ ] Build pull sync (Supabase → local on app open)
- [ ] Handle sync conflicts (last-write-wins strategy)
- [ ] Add sync status indicator in UI (synced / pending / error)
- [ ] Test full offline scenario — create transactions, go online, verify sync
- [ ] Handle auth token refresh for long offline periods

---

### PHASE 5 — Forecasting & Insights (Week 4–5)
- [ ] Calculate average daily spend per category (rolling 30 days)
- [ ] Build end-of-month projection ("you'll be short X")
- [ ] Build what-if simulator UI ("cut X by Y times = save Z")
- [ ] Detect spending anomalies (>30% above weekly average)
- [ ] Build weekly pattern chart (Mon–Sun spending heatmap)
- [ ] Build category breakdown pie/bar chart
- [ ] Build net worth tracker (assets input vs liabilities)
- [ ] Weekly summary card — generated Sunday, one tap to review
- [ ] Wire Claude API to explain insights in plain language ("why am I spending more?")

---

### PHASE 6 — Voice + OCR (Week 5)
- [ ] Integrate Whisper API for voice recording + transcription
- [ ] Build voice input button on quick-add screen
- [ ] Parse transcribed text with Claude into transaction fields
- [ ] Integrate Google ML Kit for receipt photo OCR
- [ ] Build camera capture flow for receipts
- [ ] Extract amount + merchant from OCR text via Claude
- [ ] Store receipt image in Supabase Storage, link to transaction

---

### PHASE 7 — Gamification (Week 6)
- [ ] Build streak tracker (consecutive days/weeks reviewed)
- [ ] Build goals screen with progress bars and deadlines
- [ ] Trigger savings win celebration when goal milestone hit
- [ ] Build weekly 2-minute review flow (summary → approve → done)
- [ ] Write positive-framing copy for all budget alerts
- [ ] Add achievement badges (first GH¢1000 saved, 30-day streak, etc.)

---

### PHASE 8 — Polish + Security (Week 7)
- [ ] Add PIN lock screen
- [ ] Add biometric authentication (fingerprint / Face ID)
- [ ] Dark mode support across all screens
- [ ] Export transactions to CSV
- [ ] Export monthly report to PDF
- [ ] Error boundary handling throughout app
- [ ] Empty states for every screen (no data yet)
- [ ] Loading skeletons for all data-fetching screens
- [ ] Accessibility audit (font sizes, contrast, tap targets)
- [ ] Performance audit (no jank on transaction list with 1000+ items)

---

### PHASE 9 — Launch Prep (Week 8)
- [ ] Set up Expo EAS Build for Android APK + iOS (if needed)
- [ ] Set up Expo EAS for web deployment (Vercel or Netlify)
- [ ] Write privacy policy (no data selling, encryption details)
- [ ] App icon + splash screen design
- [ ] Play Store listing (screenshots, description)
- [ ] Beta test with 5 people, collect feedback
- [ ] Fix top 10 bugs from beta
- [ ] Soft launch 🚀

---

## 📊 Total Estimate
| Phase | Time |
|---|---|
| Setup | 1 day |
| Core transactions | 1 week |
| SMS + AI | 1 week |
| Budgets | 1 week |
| Offline sync | 3–4 days |
| Forecasting | 1 week |
| Voice + OCR | 3–4 days |
| Gamification | 3–4 days |
| Polish | 1 week |
| Launch prep | 3–4 days |
| **Total** | **~8 weeks solo** |

---

That's your full roadmap. Want to start Phase 0 right now? I can scaffold the Expo project, set up the folder structure, and write the WatermelonDB schema — we can have a running skeleton by end of today.
