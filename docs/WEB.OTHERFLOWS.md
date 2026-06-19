You're absolutely right — those three are completely different experiences and deserve their own deep treatment. Let me go through each one properly.

---

# 1. Financial OS — Mobile Onboarding

This is fundamentally different from the budget app onboarding. The budget app onboarding was about one thing: get them logging transactions fast. The OS onboarding has a harder job — it needs to map someone's **entire financial life** without overwhelming them. The risk here is asking too much too soon and losing them before they see the value.

The principle: **progressive financial disclosure.** You don't ask someone their net worth on the first date. You earn the right to go deeper as they trust you more.

---

## The Core Philosophy

The OS onboarding has three jobs in order:
1. **Hook them emotionally** — make them feel this is different
2. **Get minimum viable data** — just enough to show real value
3. **Invite them to go deeper** — over days, not in one session

The entire first session should take under **4 minutes.** Everything else gets filled in naturally over the first two weeks through gentle prompts.

---

## Screen by Screen

**Screen 1 — The Positioning Screen**

Full screen. Dark, premium feel. A subtle animated graphic — think a constellation of connected dots representing their financial life coming together.

Large text, centered:
> *"Your complete financial life. One place."*

Smaller text below:
> *"Not just budgets. Your accounts, investments, debt, insurance — everything connected, always current."*

One button: **"Show me →"**

No sign up. No email. Not yet. Let them see it first.

*Why this works:* It signals immediately that this is not another budget app. The visual and the copy set a different emotional register — calm, premium, serious but not intimidating.

---

**Screen 2 — The Promise Screen**

Three cards that slide in one by one, each with an icon and a single line:

```
🔮  Know your real net worth — always
🤖  An AI advisor who knows your numbers
⚡  Automatic. Works while you don't
```

Below: **"Let's build your financial picture"**

Small text: *"Takes about 3 minutes. You can add more later."*

One button: **"I'm in →"**

*Why this works:* It sets expectations (3 minutes, can add more later) so they don't feel trapped. The three promises speak to the three emotional needs: clarity, guidance, and effortlessness.

---

**Screen 3 — Account Creation (Minimal)**

```
What should we call you?
[First name field — auto-focused]

Your email
[Email field]

Create a password
[Password field]

        [Create my account →]

Already have an account? Sign in
```

- Three fields only. No last name, no phone number, no date of birth yet
- Password field has a strength indicator — satisfying to fill
- "Continue with Google" above the form as the fastest path
- No terms and conditions wall — link at the bottom, small, unobtrusive

*Why this works:* Most apps ask for too much upfront. Name and email is all they need to get started. Everything else comes later.

---

**Screen 4 — The Financial Snapshot Question**

This is the most important design decision in the entire onboarding. You need to understand their financial life without making it feel like a questionnaire.

A single, warm question:

> *"To set up your financial picture, which of these best describes you right now?"*

Four big illustrated cards, tap to select:

```
┌─────────────────────┐  ┌─────────────────────┐
│  🌱                 │  │  📈                 │
│  Building my        │  │  Growing my         │
│  foundation         │  │  wealth             │
│                     │  │                     │
│  (tracking, saving, │  │  (investing, assets,│
│   debt payoff)      │  │   multiple income)  │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  🏠                 │  │  🎯                 │
│  Working toward     │  │  Planning a         │
│  a big goal         │  │  major life event   │
│                     │  │                     │
│  (house, car,       │  │  (wedding, baby,    │
│   education)        │  │   retirement)       │
└─────────────────────┘  └─────────────────────┘
```

- No wrong answer
- This shapes everything: default modules shown, advisor tone, suggested goals, budget defaults
- They tap one. That's it. No follow-up questions on this screen

*Why this works:* It feels like a personality quiz, not a form. And it gives the app enough context to make the first experience feel personalised without asking 10 questions.

---

**Screen 5 — Your Currency & Location**

Simple, fast:

```
Your primary currency

  🇬🇭 GHS — Ghanaian Cedi  ✓ (pre-selected)

  (Other options below in a scrollable list)
```

If device locale is Ghana → GHS pre-selected, they just tap Next

If different locale → they pick their currency first

One tap. Done.

*Why this works:* Pre-selection means most users spend 0 seconds here. It's respectful of their time.

---

**Screen 6 — The First Module: Accounts**

Here's where the OS onboarding diverges most dramatically from the budget app.

Instead of going straight to SMS permissions, the OS first needs to understand what financial accounts exist in their life.

A clean screen:

> *"Let's start with where your money lives"*
> *"Add at least one account to get started"*

Below, a list of account types as large tappable chips:

```
[🏦 Bank Account]   [📱 Mobile Money]
[💰 Cash]           [📈 Investment]
[🏠 Property]       [💳 Other]
```

They tap **Mobile Money** first (most common in Ghana):

A mini-form slides up:
```
Network:    [MTN ▼]  (or Vodafone, AirtelTigo)
Name:       MTN MoMo
Balance:    GH¢ [_______]
           (rough estimate is fine)
```

Two fields. Tap Save.

The account appears as a card:
```
✓ MTN MoMo added
  GH¢ 1,200
```

A gentle prompt: *"Add another account? (You can always do this later)"*

[Add another] or [That's enough for now →]

*Why this works:* They see their first real number appear immediately. It's their data. The app already feels personal. The "rough estimate is fine" removes the pressure to be precise. And the exit option at every step removes anxiety.

---

**Screen 7 — The SMS Permission (Evolved)**

Now that they've added at least one account, the SMS permission ask makes complete sense — it's in context.

```
Here's where the magic happens

You just added your MoMo account.
We can keep it updated automatically.

When MoMo sends you an SMS for any
transaction, we read it and log it —
so you never have to type a thing.

Your SMS never leaves your phone.
We read, then immediately discard.
Nothing is uploaded.

         [Yes, keep me updated 📱]

    I'll update balances manually instead
```

- The privacy explanation is specific and credible — "read then discard"
- The benefit is concrete — "you never have to type a thing"
- The opt-out is respectful — no guilt, just a smaller experience
- Then the Android system dialog appears — they're already sold

*Why this works:* By this point they've already seen value (their account is there, the number is real). The permission ask comes after trust is established, not before.

---

**Screen 8 — Quick Income Setup**

One question, big and simple:

> *"Roughly, what comes in each month?"*

A large number pad slides up. They type their approximate monthly income. No labels. No categories yet.

```
Monthly income (approx)
GH¢ [    3,200    ]

[This varies month to month]  ← tap if irregular
```

If they tap "This varies":
```
What's a typical month for you?
[Under GH¢1,000] [GH¢1,000–3,000]
[GH¢3,000–6,000] [GH¢6,000+]
```

Four big range buttons. They tap one. Done.

*Why this works:* The app needs income data to calculate the health score, debt ratios, and emergency fund targets. But asking for exact figures feels invasive. Approximate is enough to start.

---

**Screen 9 — The First Health Score (The Wow Moment)**

This is the equivalent of the budget app's "we found 8 transactions" moment.

A loading screen — genuinely calculating:
*"Building your financial picture..."*

Then it reveals — for the first time — their Financial Health Score:

```
        ◉
       68
   Your Score

Your finances are taking shape, [Name].

Here's your picture so far:

💰 Liquid assets:      GH¢ 1,200
📊 Monthly income:     GH¢ 3,200
🏦 Accounts tracked:   1

Complete your picture to improve your score:
→ Add debts you're repaying     +8 pts
→ Track your investments        +6 pts
→ Set up emergency fund         +5 pts

[Start exploring →]
```

- They have a real score based on real (if limited) data
- The incomplete items are framed as opportunities, not gaps
- Each one shows the exact points they'd gain — gamified without being gimmicky
- **"Start exploring"** takes them to the home screen — they're in

*Why this works:* Even with minimal data, they have a score. A real number. Something to improve. The hook is set.

---

**Screen 10 — The Home Screen (First Time)**

They land on the home screen for the first time. It's not empty — it has their score, their account, a welcome briefing.

A first-time overlay appears (not a modal, just a soft highlight that pulses):

```
Your command center 👆

This score updates as you add more
to your financial picture.

Tap any card to explore.
```

Tap anywhere → overlay disappears. They're free to explore.

No tutorial tour. No 10-step walkthrough. Just one sentence and freedom.

---

## The First Two Weeks — Progressive Deepening

Onboarding doesn't end at screen 10. The OS uses the first two weeks to gently collect the rest of the picture through **contextual prompts** — not pop-ups, but cards that appear naturally in the relevant module.

| Day | Prompt | Where it appears |
|---|---|---|
| Day 2 | *"Do you have any loans or debts? Tracking them improves your score"* | Home briefing |
| Day 3 | *"Any savings or investments? T-bills, susu, mutual funds?"* | Wealth tab |
| Day 5 | *"What's your emergency fund situation?"* | Home briefing |
| Day 7 | *"You've been using the app a week — want to set a financial goal?"* | Goals module |
| Day 10 | *"Do you have insurance policies to track? We'll remind you before they expire"* | Protection tab |
| Day 14 | *"Your financial picture is [X]% complete. Add one more thing?"* | Home screen |

Each prompt is one card. One action. Never more than one per day. They can dismiss any of them permanently with "Don't ask again."

---

# 2. Budget App — Web Version (Onboarding + Full UX)

The web version of the budget app serves a fundamentally different use case than mobile. On mobile, people check in quickly, approve transactions, glance at balances. On web, people sit down, plan deliberately, review the month, set up their system.

**Web is for depth. Mobile is for the moment.**

This shapes every design decision.

---

## Web Design Principles

- **More information density is okay** — larger screen means you can show more without overwhelm
- **Sidebar navigation** replaces bottom tabs
- **Keyboard shortcuts** for power users
- **Hover states** reveal secondary actions — no need to tap and hold
- **Multi-column layouts** for comparison views
- **The web is where people set up. Mobile is where they live**

---

## Web Onboarding

The web onboarding is slightly longer than mobile but more powerful — people are at a computer, they have time, they came here deliberately.

**Landing / Sign Up Page**

Not the app yet. A proper web landing page:

```
┌─────────────────────────────────────────────────────┐
│  [Logo]                          [Sign in]  [Start] │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Track every cedi.                                 │
│   Automatically.                                    │
│                                                     │
│   The budget tracker that reads your MoMo           │
│   and bank SMS so you never have to type            │
│   a transaction again.                              │
│                                                     │
│   [Start free →]      [Watch 60-second demo]        │
│                                                     │
│   ──────────────────────────────────────            │
│   3 features shown as animated screenshots          │
│   SMS parsing · Voice input · Forecasting           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

They click "Start free" → sign up form appears inline (not a new page):

```
Name: [__________]    Email: [______________]
Password: [__________]

              [Create account →]

         Or continue with [G Google]
```

Done. They're in.

---

**Web Onboarding Step 1 — Welcome & Context**

A split-screen layout — left side is the onboarding wizard, right side shows a live preview of what the app will look like with their data:

```
┌──────────────────────┬──────────────────────────────┐
│                      │                              │
│  Welcome, [Name] 👋  │    [App preview — animated   │
│                      │     dashboard with sample    │
│  Let's set up your   │     data showing what        │
│  budget in 4 steps.  │     it'll look like]         │
│                      │                              │
│  ① Your income       │                              │
│  ② Your categories   │                              │
│  ③ Your first budget │                              │
│  ④ Connect your SMS  │                              │
│                      │                              │
│  [Let's start →]     │                              │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

The preview on the right updates in real time as they fill in information — they see the dashboard building itself as they go. Incredibly satisfying.

---

**Web Onboarding Step 2 — Income**

Left panel:

```
Step 1 of 4: Your income

How much do you bring in each month?
[GH¢ ___________]

How often do you get paid?
○ Monthly   ○ Weekly   ○ Bi-weekly   ○ It varies

Any other income sources?
[+ Add another source]  (optional)

                    [Next →]
```

Right panel: the preview dashboard shows income bar filling up as they type. Real-time. Delightful.

---

**Web Onboarding Step 3 — Categories & Budgets**

This is where web really shines over mobile. You can show more at once.

```
Step 2 of 4: Your spending categories

We've suggested a starter set. Adjust the
budgets to match your life.

┌──────────────────────────────────────────────────┐
│ Category      │ Monthly Budget │ (remove)        │
├──────────────────────────────────────────────────┤
│ 🍔 Food       │ GH¢ [  600  ]  │ ×               │
│ 🚗 Transport  │ GH¢ [  300  ]  │ ×               │
│ 📱 Airtime    │ GH¢ [  100  ]  │ ×               │
│ 🏠 Rent       │ GH¢ [  800  ]  │ ×               │
│ 💡 Utilities  │ GH¢ [  150  ]  │ ×               │
│ 🎯 Savings    │ GH¢ [  400  ]  │ ×               │
├──────────────────────────────────────────────────┤
│ [+ Add category]                                 │
├──────────────────────────────────────────────────┤
│ Total budgeted: GH¢2,350                         │
│ Income: GH¢3,200                                 │
│ Unallocated: GH¢850  ← assign this or keep free │
└──────────────────────────────────────────────────┘

                    [Next →]
```

- All budgets editable inline — click any number and type
- The "Unallocated" line updates live as they adjust
- Remove categories with one click
- Add custom ones instantly
- The right preview panel shows the envelope layout taking shape

*Why this works:* Web allows a table view of all categories at once. On mobile, you'd have to scroll through them one by one. Here it's a complete picture.

---

**Web Onboarding Step 4 — SMS Setup (Different on Web)**

On mobile, SMS reading is native and automatic. On web, it's different — browsers can't read SMS.

```
Step 3 of 4: Keeping it up to date

The app works best when transactions
are logged automatically.

On your phone (recommended):
┌──────────────────────────────────────────┐
│  📱 Download the mobile app              │
│  It reads your MoMo and bank SMS         │
│  automatically. Transactions sync        │
│  to this web dashboard instantly.        │
│                                          │
│  [Send download link to my phone →]      │
│  (We'll text you a link right now)       │
└──────────────────────────────────────────┘

On the web only:
┌──────────────────────────────────────────┐
│  📧 Forward SMS alerts to your email    │
│  Set your bank/MoMo to send email        │
│  alerts. We'll parse them automatically. │
│  [Set up email parsing →]               │
└──────────────────────────────────────────┘

Or just log manually — that works too.
[I'll log manually for now →]
```

- Honest about the limitation — web can't read SMS natively
- The best solution (mobile app) is the first suggestion, with a frictionless way to get it
- Email forwarding as a clever web-specific workaround
- Manual as an always-available fallback
- No guilt for choosing manual

---

**Web Onboarding Step 5 — The First Dashboard**

```
Step 4 of 4: You're all set! 🎉

[Animated confetti in the right panel]

Your budget is ready.

GH¢3,200 income  ·  GH¢2,350 budgeted  ·  GH¢850 free

[Go to my dashboard →]
```

They click through → full web dashboard loads, already personalised with their data.

---

## Full Web Budget App UI

**The Layout**

```
┌──────────┬───────────────────────────────────────────┐
│          │  ┌─────────────────────────────────────┐  │
│  SIDEBAR │  │           TOP BAR                   │  │
│          │  └─────────────────────────────────────┘  │
│  Logo    │                                            │
│          │                                            │
│  Home    │                                            │
│  Trans.  │           MAIN CONTENT AREA               │
│  Budget  │                                            │
│  Insights│                                            │
│  Goals   │                                            │
│          │                                            │
│  ─────   │                                            │
│  Settings│                                            │
│  Profile │                                            │
└──────────┴───────────────────────────────────────────┘
```

Left sidebar: always visible, collapses to icons only on smaller laptops.
Top bar: search, notifications bell, quick-add button, profile avatar.

---

**Web Dashboard (Home)**

Three-column layout:

```
┌──────────────────┬───────────────────┬───────────────┐
│                  │                   │               │
│  THIS MONTH      │  ENVELOPES        │  RECENT       │
│                  │                   │  TRANSACTIONS │
│  Income  3,200   │  🍔 Food          │               │
│  Spent   1,760   │  GH¢180 left      │  Shoprite     │
│  Saved     440   │  ████████░░       │  -GH¢120      │
│  Left      800   │                   │  Today 2:34pm │
│                  │  🚗 Transport     │               │
│  ──────────────  │  GH¢95 left       │  MoMo Top-up  │
│                  │  ██████░░░░       │  +GH¢500      │
│  PENDING (3)     │                   │  Today 11am   │
│  ────────────    │  📱 Airtime       │               │
│  [Card to review]│  GH¢40 left       │  Bolt ride    │
│  GH¢120 Shoprite │  █████████░       │  -GH¢35       │
│  [✓] [Edit]      │                   │  Yesterday    │
│                  │  [+ Add envelope] │               │
│  [Card to review]│                   │  [View all →] │
│  GH¢35 Bolt      │                   │               │
│  [✓] [Edit]      │                   │               │
└──────────────────┴───────────────────┴───────────────┘
```

- Left column: the critical numbers + pending approvals
- Middle column: envelope health at a glance
- Right column: recent activity stream
- Everything visible without scrolling on a standard laptop

**Pending Approvals on Web**

Unlike mobile (cards you swipe), web shows them in the left column as a mini list:

- Each pending item has [✓ Confirm] and [✏️ Edit] inline
- Confirm with one click — no modal, no sheet, just done
- Edit opens a small inline form right there in the column
- Multiple approvals can be confirmed with a [✓ Confirm all] button at the top
- Keyboard shortcut: press Enter to confirm, Delete to dismiss — power users love this

---

**Web Transactions Screen**

This is where web truly beats mobile. A full spreadsheet-like view:

```
┌────────────────────────────────────────────────────────────────┐
│ Transactions          [Search...]    [Filter ▼]  [Export ▼]   │
├────────────────────────────────────────────────────────────────┤
│ Date        │ Merchant      │ Category    │ Amount  │ Account  │
├────────────────────────────────────────────────────────────────┤
│ Today       │ Shoprite      │ 🍔 Food     │ -GH¢120 │ MoMo    │
│ Today       │ Bolt          │ 🚗 Transport│ -GH¢35  │ MoMo    │
│ Yesterday   │ MTN MoMo      │ 💰 Income   │ +GH¢500 │ MoMo    │
│ Mar 14      │ Shell         │ 🚗 Transport│ -GH¢80  │ Cash    │
│ Mar 14      │ Melcom        │ 🛍️ Shopping │ -GH¢320 │ MoMo    │
└────────────────────────────────────────────────────────────────┘
```

- Click any row → expands inline to show full details and edit fields
- Click any column header → sorts by that column
- Filter bar: by date range, category, account, amount range, source (SMS/manual/voice)
- Bulk actions: select multiple → bulk recategorise or delete
- Export: CSV or PDF with current filters applied

Inline editing on web is a huge advantage — on mobile you need a separate screen. Here it's one click.

---

**Web Budget Screen**

Side by side comparison layout — the web's biggest advantage over mobile:

```
┌──────────────────────────────────────────────────────┐
│  Budget — March 2025                [← Feb] [Apr →]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Category    Budget    Spent    Left     Progress    │
│  ──────────────────────────────────────────────────  │
│  🍔 Food      600       420      180    ████████░░   │
│  🚗 Transport 300       205       95    ██████░░░░   │
│  📱 Airtime   100        60       40    █████░░░░░   │
│  🏠 Rent      800       800        0    ██████████   │
│  💡 Utilities 150        85       65    █████░░░░░   │
│  🎯 Savings   400       400        0    ██████████✓  │
│  ──────────────────────────────────────────────────  │
│  Total       2,350    1,970      380                 │
│                                                      │
│  Unbudgeted spending this month: GH¢0                │
│  Income this month: GH¢3,200                         │
│  Free cashflow: GH¢850                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Click any budget number → editable inline
- Click any category name → see all transactions in that category in a side panel
- Previous months accessible with arrow keys
- Clicking [← Feb] slides in February's data with a comparison column

---

**Web Insights Screen**

The web insights screen can show more charts simultaneously — but the rule is still: one insight, one clear so-what.

```
┌────────────────────────────┬─────────────────────────┐
│  MONTH FORECAST            │  SPENDING BY CATEGORY   │
│                            │                         │
│  "You'll have GH¢340 left  │  [Pie or donut chart]   │
│   at month end if current  │                         │
│   pattern continues"       │  Food       36%         │
│                            │  Transport  17%         │
│  ─────────────────────     │  Rent       27%         │
│  What-if simulator:        │  Other      20%         │
│                            │                         │
│  If I cut [Food ▼] by      │                         │
│  [1x/week]  → +GH¢80/mo   │                         │
│                            │                         │
│  [Apply this plan]         │                         │
└────────────────────────────┴─────────────────────────┘

┌────────────────────────────────────────────────────┐
│  WEEKLY PATTERN                                    │
│                                                    │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                 │
│  [bar chart — Sat and Sun taller]                  │
│                                                    │
│  "You spend 34% more on weekends, mostly on food"  │
└────────────────────────────────────────────────────┘
```

Two charts visible simultaneously on web — impossible on mobile without scrolling.

---

# 3. Financial OS — Web UX/UI

The web version of the full financial OS is the most powerful interface of all four. People use this to do their serious financial thinking — monthly reviews, investment decisions, planning sessions. It needs to feel like a professional financial tool, not a consumer app.

Think: the feeling of a Bloomberg terminal, but beautiful and human.

---

## Web OS Design Principles

All previous principles plus:

- **Dashboard density is a feature, not a bug** — power users want more information visible
- **The sidebar becomes a navigation system** — hierarchical, organised by the 5 modules
- **Keyboard first** — every major action has a keyboard shortcut
- **Tables over cards** — web users are comfortable with denser data views
- **Print-quality outputs** — the reports and PDFs should look exceptional

---

## The Web OS Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Financial OS    [Search everything...]   🔔  [Avatar]  │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│  🏠 Home │                                                       │
│          │                                                       │
│  💸 Money│              MAIN CONTENT AREA                        │
│   ├ Trans│                                                       │
│   ├ Budget                                                       │
│   └ Bills│                                                       │
│          │                                                       │
│  💎 Wealth                                                       │
│   ├ Net Worth                                                    │
│   ├ Accounts                                                     │
│   └ Investments                                                  │
│          │                                                       │
│  📈 Grow │                                                       │
│   ├ Debt │                                                       │
│   ├ Goals│                                                       │
│   └ Tax  │                                                       │
│          │                                                       │
│  🛡️ Protect                                                      │
│   ├ Insurance                                                    │
│   └ Emerg Fund                                                   │
│          │                                                       │
│  📁 Vault│                                                       │
│          │                                                       │
│  🤖 Advisor                                                      │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

The sidebar is fully hierarchical — modules expand to show sub-sections. Collapsible. This is a navigation system worthy of the complexity underneath it.

---

## Web OS Home — The Command Center

This is the most information-dense screen in the entire product, but still follows the one-job-per-section rule.

```
┌────────────────────────────────────────────────────────────────┐
│  Good morning, Kwame  ·  Sunday, March 16                      │
│  Here's your financial picture                                 │
├───────────────┬──────────────────┬────────────────────────────┤
│               │                  │                            │
│  HEALTH SCORE │  NET WORTH       │  TODAY'S BRIEFING          │
│               │                  │                            │
│      74       │  GH¢ 47,200      │  → Bill due Fri: GH¢85    │
│   ◉ Good      │  ↑ +GH¢1,840     │  → T-bill matures June 14  │
│               │  this month      │  → Invoice overdue GH¢2,500│
│  [See detail] │  [See breakdown] │  → Phone goal: 82% ✓      │
│               │                  │                            │
├───────────────┴──────────────────┴────────────────────────────┤
│                                                                │
│  MODULES OVERVIEW                                              │
│  ──────────────────────────────────────────────────────────── │
│  💸 MONEY        💎 WEALTH       📈 GROW       🛡️ PROTECT     │
│                                                                │
│  GH¢800 left     GH¢47,200       GH¢5,200      8/10          │
│  this month      net worth       in debt       protected      │
│                                                                │
│  3 pending ⚠️    ↑4.1% month     Free Mar '26  Car ins ⚠️     │
│                                                                │
│  [Open →]        [Open →]        [Open →]      [Open →]       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  CASHFLOW          LAST 12 MONTHS NET WORTH                    │
│  ─────────────     ───────────────────────────────────────    │
│  [12-month         [Line graph showing net worth climbing]     │
│   income vs         Apr  May  Jun  Jul  Aug  Sep  ...  Mar    │
│   expense bars]    35k  36k  38k  39k  41k  43k  ...  47k    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Three panels at the top — the three most important numbers: Health Score, Net Worth, Today's Briefing. Below that, four module tiles with the key number for each. Below that, two charts side by side. Everything on one screen. No scrolling needed on a standard monitor.

---

## Web OS — Money Tab (Cashflow)

Same as the web budget app but now in the sidebar context of the full OS. One key addition: the connection to other modules is visible.

```
┌────────────────────────────────────────────────────────────────┐
│  Money — March 2025                                            │
├──────────────┬──────────────────────────┬─────────────────────┤
│              │                          │                     │
│  SUMMARY     │  ENVELOPES               │  PENDING            │
│              │                          │                     │
│  In  3,200   │  (full envelope table    │  3 to review        │
│  Out 1,970   │  same as budget app web) │                     │
│  Free  800   │                          │  Shoprite  GH¢120   │
│  Saved 430   │                          │  [✓] [Edit]         │
│              │                          │                     │
│  ─────────   │                          │  Bolt     GH¢35     │
│              │                          │  [✓] [Edit]         │
│  → GH¢430    │                          │                     │
│  allocated   │                          │  [✓ All]            │
│  to savings  │                          │                     │
│  this month  │                          │                     │
│              │                          │                     │
└──────────────┴──────────────────────────┴─────────────────────┘
```

The "→ GH¢430 allocated to savings this month" line shows the connection to the Wealth module — this isn't siloed data anymore.

---

## Web OS — Wealth Tab

The most powerful screen in the whole product.

```
┌────────────────────────────────────────────────────────────────┐
│  Wealth Overview                              [+ Add Asset]    │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│  NET WORTH TIMELINE      │  ALLOCATION                        │
│                          │                                     │
│  [Beautiful line chart   │  [Donut chart]                     │
│   showing 12 months]     │                                     │
│                          │  Liquid      29%  GH¢13,700        │
│  GH¢47,200 today         │  Investments 47%  GH¢22,000        │
│  ↑ GH¢12,200 this year   │  Property    32%  GH¢15,000        │
│  ↑ GH¢1,840 this month   │                                     │
│                          │  Diversification: 🟢 Good          │
├──────────────────────────┴─────────────────────────────────────┤
│                                                                │
│  ALL ASSETS & LIABILITIES                                      │
│  ──────────────────────────────────────────────────────────── │
│  Name              Type         Value      Change    Updated   │
│  GCB Account       Bank         GH¢8,200   —         Today    │
│  Ecobank Account   Bank         GH¢3,800   —         Today    │
│  MTN MoMo          Mobile Money GH¢1,200   —         Today    │
│  Cash              Cash           GH¢500   —         Mar 1    │
│  Databank Fund     Investment  GH¢12,000   +8.2%     Mar 10   │
│  Treasury Bills    Investment  GH¢10,000   +20%      Feb 1    │
│  Lapaz Property    Real Estate GH¢15,000   —         Jan 1    │
│  ─────────────────────────────────────────────────────────── │
│  Consolidated Loan Liability  -GH¢4,000   paid 62%  Auto     │
│  Personal Loan     Liability  -GH¢1,200   —         Mar 1    │
│  ──────────────────────────────────────────────────────────── │
│  NET WORTH                         GH¢47,200                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Click any row → expands inline with full details, edit fields, transaction history.
The chart and allocation donut update in real time as you edit values.

---

## Web OS — Investments Deep Dive

```
┌────────────────────────────────────────────────────────────────┐
│  Investments                   [+ Add Investment]  [Export]    │
├─────────────────────────────────────────────────────────────── │
│  [Performance] [Allocation] [History] [Upcoming Maturities]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  PERFORMANCE TAB                                               │
│  ──────────────────────────────────────────────────────────── │
│  Name            Value      Cost Basis  Return    Return %    │
│  Databank Fund   GH¢12,000  GH¢11,089   +GH¢911   +8.2%      │
│  Treasury Bills  GH¢10,000  GH¢ 9,513   +GH¢487   +5.1%      │
│  Bitcoin         GH¢ 2,400  GH¢ 1,829   +GH¢571   +31.2%     │
│  ──────────────────────────────────────────────────────────── │
│  Total           GH¢24,400  GH¢22,431  +GH¢1,969  +8.8%      │
│                                                                │
│  vs inflation (23%): ⚠️ Below inflation                       │
│  Tip: T-bills at 28% would beat inflation. [See options]      │
│                                                                │
│  UPCOMING MATURITIES                                           │
│  Treasury Bills mature June 14 · GH¢10,487 due               │
│  [Reinvest] [Move to savings] [Remind me closer to date]      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

The **Upcoming Maturities** section is a web-exclusive feature — shows a calendar of when investments mature, dividends are due, T-bill payouts arrive. On mobile it's a notification. On web it's a planning tool.

---

## Web OS — Debt Screen

```
┌────────────────────────────────────────────────────────────────┐
│  Debt Intelligence                          [+ Add Debt]       │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│  OVERVIEW                │  PAYOFF COMPARISON                 │
│                          │                                     │
│  Total debt: GH¢5,200    │  Minimum payments:                 │
│  Debt-free: Mar 2026     │  → Free Mar 2026                   │
│  D/I Ratio: 8.7% 🟢      │  → Total interest: GH¢840          │
│                          │                                     │
│                          │  Avalanche strategy:               │
│                          │  → Free Jan 2026 ← 2 months sooner │
│                          │  → Total interest: GH¢500          │
│                          │  → Save GH¢340                     │
│                          │                                     │
│                          │  [Switch to Avalanche]             │
├──────────────────────────┴─────────────────────────────────────┤
│                                                                │
│  ALL DEBTS                                                     │
│  ──────────────────────────────────────────────────────────── │
│  Name          Balance    Rate   Monthly   Paid    Free Date  │
│  Bank Loan     GH¢4,000   22%    GH¢400    62%     Mar 2026   │
│  Kofi (friend) GH¢1,200    0%    GH¢100     0%     Dec 2025   │
│  ──────────────────────────────────────────────────────────── │
│                                                                │
│  EXTRA PAYMENT SIMULATOR                                       │
│  If I pay GH¢ [___] extra per month →                         │
│  Debt-free: [calculates live] · Interest saved: [calculates]  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

The web payoff comparison works as a side-by-side table — on mobile it was a single card that flipped. Much easier to understand the difference at a glance.

---

## Web OS — AI Advisor

This is where the web really shines for the advisor. More screen real estate means a richer conversation experience.

```
┌────────────────────────────────────────────────────────────────┐
│  Your Financial Advisor 🤖                                     │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│  CONVERSATION            │  YOUR FINANCIAL SNAPSHOT           │
│  ──────────────────────  │  (always visible, updates live)    │
│                          │                                     │
│  Advisor: Good morning!  │  Health Score:  74 🟢              │
│  Your weekly briefing:   │  Net Worth:     GH¢47,200          │
│                          │  Monthly free:  GH¢800             │
│  ✅ Stayed under budget  │  Debt-free:     Mar 2026           │
│  ✅ T-bill interest in   │  Goals:         2 active           │
│  ⚠️ Invoice overdue      │                                     │
│                          │  ─────────────────────────         │
│  One action this week:   │  SUGGESTED QUESTIONS               │
│  Follow up on Acme       │                                     │
│  invoice — GH¢2,500      │  "Can I afford a car loan?"        │
│  would complete your     │  "How much to save for a house?"   │
│  emergency fund.         │  "Am I beating inflation?"         │
│                          │  "Best way to use next month's     │
│  You: Can I afford to    │   extra income?"                   │
│  take a loan right now?  │                                     │
│                          │  ─────────────────────────         │
│  Advisor: Based on your  │  RECENT ADVICE                     │
│  current numbers...      │  Mar 10: Debt payoff strategy      │
│  [full response]         │  Mar 3:  Emergency fund plan       │
│                          │  Feb 24: Investment allocation      │
│  [Type a question...]    │                                     │
└──────────────────────────┴─────────────────────────────────────┘
```

The right panel — always visible on web — shows the financial snapshot and suggested questions. On mobile, the advisor is full screen. On web, your financial context is always visible alongside the conversation. The advisor's answers are grounded in numbers you can see in real time.

**Recent Advice history** is a web-exclusive feature — a log of past advisor conversations you can refer back to. Saved automatically.

---

## Web OS — Tax Center

```
┌────────────────────────────────────────────────────────────────┐
│  Tax Center — 2025                    [Export for accountant]  │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│  INCOME SUMMARY          │  TAX ESTIMATE                      │
│                          │                                     │
│  Salary:    GH¢36,000    │  Taxable income: GH¢39,600         │
│  Freelance:  GH¢4,800    │  (after GH¢1,200 deductions)       │
│  Rental:     GH¢4,800    │                                     │
│  Total:     GH¢45,600    │  Estimated tax:  GH¢5,100          │
│                          │  Effective rate: 11.2%             │
│  Deductions: GH¢1,200    │                                     │
│  [See all deductions]    │  Next filing due: April 30          │
│                          │  [Set reminder]  [See breakdown]   │
├──────────────────────────┴─────────────────────────────────────┤
│                                                                │
│  MONTHLY INCOME TRACKER                                        │
│  ──────────────────────────────────────────────────────────── │
│  Month    Salary    Freelance   Rental    Total    Tax Estimate│
│  Jan      3,000         0        400      3,400        GH¢318  │
│  Feb      3,000       800        400      4,200        GH¢437  │
│  Mar      3,000     4,000        400      7,400        GH¢942  │
│  ──────────────────────────────────────────────────────────── │
│  YTD      9,000     4,800      1,200     15,000      GH¢1,697  │
│                                                                │
│  ⚠️ March was a high income month (freelance project).         │
│     Consider setting aside GH¢942 for tax this month.         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

The monthly income table is only possible on web — a true YTD view that builds throughout the year. On mobile, it's cards. On web it's a planning spreadsheet.

---

## Web OS — Document Vault

```
┌────────────────────────────────────────────────────────────────┐
│  Document Vault 🔒                [Search...]  [+ Upload]      │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│  FOLDERS                 │  RECENT DOCUMENTS                  │
│                          │                                     │
│  📂 Insurance     (3)    │  Name              Date    Type    │
│  📂 Loans         (2)    │  Car Insurance.pdf  Mar 1  Insur.  │
│  📂 Pay Slips    (12)    │  Salary Slip Feb    Feb 28 Payslip │
│  📂 Receipts     (47)    │  Loan Agreement     Jan 15 Loan    │
│  📂 Tax Docs      (3)    │  SSNIT 2024         Dec 1  Tax     │
│  📂 Property      (1)    │                                     │
│  📂 Contracts     (2)    │  [View all]                        │
│                          │                                     │
│  [+ New folder]          │  EXPIRING SOON                     │
│                          │  Car insurance · 14 days · [Renew] │
│                          │                                     │
│  STORAGE                 │  SHARE                             │
│  12.4 MB / 1 GB          │  [Generate secure link]            │
│  [████░░░░░░] 1.2%       │  (for loan applications etc.)      │
│                          │                                     │
└──────────────────────────┴─────────────────────────────────────┘
```

The right panel shows recent docs and expiring items — at a glance, no searching needed. The secure share feature is web-first — generate a time-limited link to share a document with a bank or accountant without emailing sensitive files.

---

## The Grand Summary — What's Different Across All Four

| | Budget App Mobile | Budget App Web | Financial OS Mobile | Financial OS Web |
|---|---|---|---|---|
| **Primary use** | Daily check-ins | Monthly planning | Complete financial life | Deep analysis + planning |
| **Navigation** | Bottom tabs | Sidebar | Bottom tabs (5) | Hierarchical sidebar |
| **Data density** | Low (calm) | Medium | Low-Medium | High |
| **Onboarding goal** | First transaction | Full budget set up | Financial snapshot | Complete picture |
| **Killer moment** | SMS parsed auto | Budget built in 4 steps | Health score appears | Full net worth view |
| **Unique to this** | SMS approval cards | Inline editing | Progressive disclosure | Side-by-side comparisons |
| **Advisor** | Not present | Not present | Chat interface | Chat + live data panel |
| **Tables** | Never | Yes | Rarely | Extensively |

---

That's all three flows done. You now have the complete UX/UI brain for all four surfaces. Want to start building? The mobile budget app onboarding is the cleanest first thing to turn into actual code.
