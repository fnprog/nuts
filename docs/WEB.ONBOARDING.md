# Financial OS — Web Onboarding

The budget app onboarding had one job: get them to their first automatic transaction in under 2 minutes. The OS onboarding has a fundamentally harder job:

**It needs to make someone feel like their entire financial life is understood, organised, and under control — in a single session — without ever feeling like hard work.**

The tension it has to resolve: the OS needs a lot of data to be powerful, but asking for a lot of data upfront kills people. Most quit financial apps during onboarding because it feels like filling out a loan application.

The solution is a principle called **progressive financial mapping.** You collect the minimum to show immediate value, then earn the right to ask for more by demonstrating what you do with each piece of information the moment they give it.

> Every time they give you data, something visually meaningful should happen immediately. The app should feel like it's building in real time.

---

## The Layout Philosophy for Web Onboarding

Unlike mobile which is linear screen-by-screen, the web onboarding uses a **persistent split-screen layout throughout:**

```
┌──────────────────────────┬──────────────────────────────────────┐
│                          │                                      │
│   LEFT PANEL             │   RIGHT PANEL                        │
│   The wizard             │   Live preview                       │
│   (what you fill in)     │   (your financial OS building        │
│                          │    itself in real time)              │
│                          │                                      │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

The left panel guides them step by step. The right panel reacts to every single input — numbers appear, charts fill, the health score updates, the net worth counter ticks up. It feels alive. It feels like the app is genuinely understanding them as they type.

This split-screen is the defining UX decision of the web onboarding. It answers the question *"why am I doing this?"* in real time — every field they fill has an immediate visible payoff on the right.

---

## Before They Even Sign Up — The Landing Experience

This is technically pre-onboarding but it shapes everything.

**The Hero Section**

Full-width, dark premium background. Not a generic fintech gradient — a deep navy with subtle depth. On the right, an animated mockup of the OS dashboard with live-looking numbers.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo · Float]                          [Sign in]  [Start free] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│   Your complete financial life.          [Animated OS dashboard  │
│   One intelligent system.                 preview — numbers      │
│                                           moving, health score   │
│   Know your net worth. Track every        pulsing, charts        │
│   cedi. Grow your wealth. Get             animating]             │
│   advice that knows your numbers.                                │
│                                                                  │
│   Built for Ghana. Built for you.                                │
│                                                                  │
│   [Start building your OS →]                                     │
│                                                                  │
│   No credit card. Free to start.                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Below the hero: three animated feature previews — not screenshots, but short looping demos (like GIFs but smoother) showing:
1. SMS parsing a MoMo transaction in real time
2. Net worth updating as an investment is added
3. The AI advisor answering a real question

Below that: a single line of social proof. *"Join 2,400 people who know exactly where their money stands."*

Then the sign-up button again. That's it. No feature laundry list, no pricing table, no FAQ. Just enough to intrigue, then get them in.

---

## The Sign-Up Gate

They click "Start building your OS →" — a modal slides up over the landing page (not a new page, keeps the context visible behind it):

```
┌──────────────────────────────────────────────┐
│                                              │
│   Create your account                        │
│                                              │
│   [G  Continue with Google]  ← fastest path  │
│                                              │
│   ──────────── or ────────────               │
│                                              │
│   First name    [____________]               │
│   Email         [____________]               │
│   Password      [____________]               │
│                                              │
│   [Create account →]                         │
│                                              │
│   By continuing you agree to our Terms       │
│   and Privacy Policy  ·  No spam, ever       │
│                                              │
└──────────────────────────────────────────────┘
```

Three fields maximum. Google sign-in is the prominent path — most people will take it and skip the form entirely.

After account creation → no email verification wall. They go straight in. Verification happens quietly in the background with a gentle banner later. **Never block the user's momentum with a verification step at the start.**

---

## The Onboarding Begins — The Persistent Split Screen

They're now inside the app for the first time. The split screen appears. This layout persists for the entire onboarding.

**Left panel:** step-by-step wizard with a progress tracker at the top
**Right panel:** the live OS preview — starts empty and builds up as they fill things in

The progress tracker at the top of the left panel:

```
① Welcome  ② Profile  ③ Accounts  ④ Income  ⑤ Snapshot
●──────────●──────────○──────────○──────────○
```

Simple dots. Current step is filled. Future steps are outlined. No percentages, no time estimates — those create anxiety. Just a sense of position.

---

## Step 1 — Welcome & Orientation (30 seconds)

**Left panel:**

```
Welcome to your Financial OS 👋

This isn't a budget app. It's your
complete financial system.

Over the next few minutes, we'll build
your personal financial picture —
net worth, cashflow, investments,
goals, and more.

The more you add, the smarter it gets.
But you can always add things later.

Let's start simple.

            [Let's build it →]
```

**Right panel:**
An empty dashboard state — but beautifully designed. Not a blank page. A set of module outlines that glow softly, waiting to be filled. Like an architect's blueprint. The message it sends: *this is what's coming, and it's going to be yours.*

One button. No decisions. Just orientation and excitement.

---

## Step 2 — Profile Setup (60 seconds)

**Left panel:**

```
First, a bit about you

What should we call you?
[First name _______________]

Your primary currency
[🇬🇭 GHS — Ghanaian Cedi  ▼]
(detected from your location)

Your financial stage — pick the one
that fits most right now:

  ○  🌱 Building my foundation
      I'm getting control of spending,
      paying down debt, starting to save

  ○  📈 Growing my wealth
      I'm investing, building assets,
      multiple income streams

  ○  🏠 Working toward a big goal
      House, car, education — I have
      something specific I'm saving for

  ○  🎯 Planning a life event
      Wedding, baby, retirement —
      a major change is coming

                [Next →]
```

**Right panel:**
As they type their name → the dashboard preview updates: *"Good morning, [Name]"* appears in the header. Immediate personalisation.

As they select their financial stage → the right panel subtly reorganises. Building foundation → cashflow and debt modules come forward. Growing wealth → investments and net worth modules come forward. The preview adapts to them in real time.

*Why the financial stage question matters:* It shapes the entire OS experience — which modules are prominent, what the advisor emphasises, what goals are suggested, what the health score weights. But it feels like a personality question, not a data form.

---

## Step 3 — Accounts (The Most Important Step)

This is the foundation of everything. Without accounts, there's no net worth, no cashflow, no real picture. But asking for too many accounts upfront is overwhelming.

The solution: **start with one, make it feel magical, then invite more.**

**Left panel — opening:**

```
Where does your money live?

Let's start with your main account.
You can add more in a moment.

What's your primary account?

  [📱 MTN MoMo]        [🟡 Vodafone Cash]
  [🔵 AirtelTigo]      [🏦 Bank Account]
  [💰 Cash]            [Other]
```

They tap their primary — let's say MTN MoMo:

```
MTN MoMo

Account name (optional)
[My MoMo _______________]

Current balance (estimate is fine)
GH¢ [______________]

        [Add account →]
```

Two fields. "Estimate is fine" removes perfectionism anxiety.

They tap Add account →

**Right panel reaction (the magic moment):**

The net worth counter, which was at GH¢0, animates upward to their entered balance. A MoMo card appears in the accounts section of the preview. The health score tick goes up slightly. The liquid assets section fills in. All of this happens in about 1.5 seconds with smooth animations.

*This is the first wow moment of the web OS onboarding.* They gave one number and their financial picture visibly started taking shape.

**Left panel — immediately after:**

```
✓ MTN MoMo added  GH¢1,200

Your net worth so far: GH¢1,200

Do you have other accounts?
(The more you add, the more
complete your picture)

  [🏦 Add bank account]
  [💳 Add another wallet]
  [📈 Add investment account]
  [💰 Add cash on hand]

          [I'll add more later →]
```

They can add more accounts here, each one triggering the same right-panel animation. Or they skip. Both are valid. The "I'll add more later" is prominent — no guilt for moving on.

For each additional account they add, the flow is the same: type, amount, done. Under 10 seconds per account.

**The right panel during this step** shows a live net worth counter that climbs with every account added. It's almost impossible not to want to keep adding accounts — watching the number grow is addictive.

**Special handling — bank accounts:**

```
Bank Account

Which bank?
[GCB  ▼]  (dropdown of Ghanaian banks)

Account name (optional)
[Main Account ___________]

Current balance (estimate is fine)
GH¢ [_______________]

📱 Want this auto-updated?
   Download the mobile app to sync
   MoMo and bank SMS automatically.
   [Send link to my phone]  (optional, skip anytime)

        [Add account →]
```

The mobile app prompt is gentle and optional — planted here because it's the natural moment (they're setting up an account that could be auto-synced). Not a wall, not a modal. Just a soft suggestion.

---

## Step 4 — Income (The Engine)

Income data powers the health score, the budget engine, cashflow forecasts, debt ratios, tax estimates. It's essential. But asking for it wrong feels like a job application.

**Left panel:**

```
Now let's understand what comes in

What's your main income?

Type:
  ○ 💼 Salary / Employment
  ○ 🎨 Freelance / Contract
  ○ 🏪 Business owner
  ○ 💰 Mixed / Multiple sources

Monthly amount (approximate)
GH¢ [_______________]

When do you usually get paid?
  ○ Monthly (specific date)
  ○ Weekly
  ○ Bi-weekly
  ○ Irregularly

        [Next →]
```

As they type the income amount → the right panel reacts:
- Monthly free cashflow estimate appears
- Health score ticks up
- A "Monthly budget capacity" figure appears in the preview
- The cashflow module in the preview starts showing a rough income bar

**If they select Irregularly:**

The form adapts:

```
No fixed income? That's fine.

What's a typical good month?
GH¢ [_______________]

What's a typical slow month?
GH¢ [_______________]

We'll build your budget around
the conservative number and treat
anything above that as bonus.
```

Two fields, honest and practical. No forcing them into a "monthly salary" box that doesn't fit their life.

**Additional income streams (optional):**

```
Any other income sources?
(These all add up to your real picture)

  [🏠 Rental income]
  [📈 Investment returns]
  [🎨 Side work]
  [+ Other]

        [That's all my income →]
```

Each one they add → right panel updates, income total grows, health score improves. Again, watching it grow is the motivation to keep adding.

---

## Step 5 — The First Snapshot (The Wow Moment)

This is the emotional centrepiece of the entire onboarding. Everything they've given so far — accounts, income, financial stage — comes together into a real health score and a real financial picture.

**Left panel — a brief loading state:**

The wizard area shows a calm animation with text cycling through:

```
Building your financial picture...

  ✓  Accounts mapped
  ✓  Income understood
  ✓  Calculating your health score
  ✓  Preparing your command center
```

Each line ticks in with a 0.5 second delay. Feels satisfying, not slow. Takes about 2.5 seconds total.

**Then the reveal:**

Left panel transitions to:

```
Your financial picture is ready, Kwame.

    ╔═══════════════════╗
    ║                   ║
    ║       68          ║
    ║   Financial       ║
    ║  Health Score     ║
    ║                   ║
    ╚═══════════════════╝

     Good start 🟢

Here's what shaped your score:

✅ Income tracked          +15 pts
✅ Accounts mapped         +12 pts
⬜ Emergency fund            0/20
⬜ Debt tracked              0/20
⬜ Investments               0/15

Your score can reach 100.
Each section you complete
unlocks more of your picture.

        [Enter my OS →]
```

**Right panel — the full reveal:**

The preview, which has been gradually building throughout onboarding, now slides into the full OS dashboard. The health score circle animates in with a satisfying arc draw. The net worth figure is there. The accounts are there. The income data has populated the cashflow module. Charts have preliminary data.

It's not perfect — it's partial. But it's **real.** Their real number. Their real accounts. Already personalised.

The feeling: *this thing already knows me, and I've barely done anything.*

---

## Step 6 — The Guided First Exploration

They click "Enter my OS →" and land on the full dashboard for the first time. But instead of dumping them there cold, a light guided layer activates.

Not a tutorial. Not a 10-step walkthrough with arrows everywhere. Something much more elegant:

**A single contextual spotlight:**

The health score pulses with a soft glow. A small callout appears beside it:

```
    Your score is 68.
    
    Three things would boost it most:
    → Add your emergency fund  (+8 pts)
    → Log any debts            (+6 pts)
    → Track investments        (+6 pts)
    
    Start with any of them, or explore freely.
    
                    [Got it]
```

They tap Got it → spotlight disappears. They're free.

No forced path. The callout gave them a suggested direction but didn't force it. If they want to go explore investments first — great. If they want to just look around — great. If they want to add their emergency fund — great.

The first experience inside the OS is freedom, not a tutorial gauntlet.

---

## The First Session — What Happens Next

After the callout dismisses, the OS has one more subtle trick. The left sidebar has a soft **"Complete your picture"** section at the bottom — not a notification, not a badge, just a quiet tracker:

```
Your financial picture
████████░░░░  42% complete

Add to improve your score:
• Emergency fund     +8 pts  [Add →]
• Debts & loans      +6 pts  [Add →]
• Investments        +6 pts  [Add →]
• Protection/insur.  +5 pts  [Add →]
• Goals              +4 pts  [Add →]
```

This lives in the sidebar permanently until their picture is complete. It's always there as a gentle invitation, never as a nag. Each item they complete disappears from the list and their score visibly improves.

The first time they complete a section — say, they add their emergency fund — a small toast appears:

```
✓  Emergency fund added
   Score: 68 → 76  (+8 points) 🎉
```

Score goes up. They feel it. They want to do the next one.

---

## The Returning User — Second Session Onboarding

The onboarding doesn't end after the first session. The first time they come back (next day, or day after), a special returning experience triggers.

**The "Continue building" banner:**

At the top of the dashboard — not a modal, just a warm banner:

```
  Welcome back, Kwame 👋  Your picture is 42% complete.
  
  You left off after adding your accounts and income.
  Next up: do you have any debts or loans to track?
  
  [Yes, add them →]    [Not right now]
```

One question. One action. Takes 30 seconds if they say yes. The banner disappears if they click "Not right now" and won't reappear for 2 days.

This continues until they hit 80% completion — at which point the app considers onboarding "done" and switches to normal weekly briefings.

---

## Edge Cases & Emotional Moments

**If they rush through adding no income and no accounts:**

Before "Enter my OS" they see:

```
Your financial picture needs
at least one account to get started.

Without it, we can't calculate
your net worth or health score.

It takes 15 seconds — just one balance.

[Add one account →]    [Skip for now]
```

Gentle push. Still skippable. But the appeal is concrete — 15 seconds.

**If they're clearly hesitant (spending more than 30 seconds on a field):**

A soft note appears below the input:

```
💡 Estimates are completely fine.
   You can update this anytime.
```

Removes the perfectionism block.

**If they close the browser mid-onboarding:**

Next time they return — an auto-save has preserved everything. They land exactly where they left off:

```
Welcome back, Kwame.

You were in the middle of setting up
your financial picture. Pick up where
you left off?

[Continue setup →]    [Start fresh]
```

No data lost. No starting over. The app respects their time.

**If they complete onboarding on mobile and then visit web:**

The web version detects the completed mobile onboarding and skips directly to the full dashboard — no duplicate questions. A welcome banner appears:

```
Your mobile setup is synced here 🔄
Everything you set up is ready on web.
```

---

## The Emotional Arc — From Landing to Fully Onboarded

The onboarding is designed as an emotional journey, not a data collection exercise:

| Moment | Emotion |
|---|---|
| Landing page | Intrigue — *"this looks different"* |
| Sign up | Trust — *"simple, no pressure"* |
| First account added | Delight — *"my number appeared!"* |
| Net worth counter climbing | Momentum — *"I want to keep adding"* |
| Health score revealed | Ownership — *"this is my number"* |
| Full dashboard reveal | Wow — *"this is already mine"* |
| First exploration | Freedom — *"I'm in control"* |
| Completion tracker | Purpose — *"I know what to do next"* |
| Second session | Investment — *"I'm building something"* |

Every step earns the next step. Every piece of data given returns visible value immediately. The onboarding ends not when all data is collected — but when the person feels that this system belongs to them.

---

## What Makes This Different From Every Other Financial App's Onboarding

| Other apps | This OS |
|---|---|
| Ask everything upfront | Ask minimum, earn the rest |
| Static forms | Live preview reacts to every input |
| Email verification wall before app | Verification in background, straight into app |
| Tutorial with arrows everywhere | One spotlight, then freedom |
| Onboarding ends at first login | Progressive deepening over first two weeks |
| "Complete your profile" feels like chores | Completing sections feels like levelling up |
| Data entry feels extractive | Data entry feels like building something yours |
| Empty states feel broken | Empty states feel like blank canvases |

---

That's the full Financial OS web onboarding — every screen, every emotional beat, every edge case. Want me to move into actually building this now?
