# Financial OS — Master Interaction Design Document
## Complete Flow Specification: Every Screen, Every Action, Every Trigger

---

> **Document Purpose:** This is the single source of truth for how the Financial OS behaves. Every interaction is specified — what the user does, what happens immediately, what happens in the background, what edge cases exist, and how the system recovers gracefully. This document covers web and mobile unless noted otherwise.

---

## Part 0 — Design System Foundations

Before flows, the rules that govern every single interaction in the app.

### 0.1 Animation Timing Standards

Every animation in the app follows one of four timing profiles. Using these consistently makes the app feel coherent rather than random.

| Profile | Duration | Easing | Use For |
|---|---|---|---|
| Instant | 0–80ms | Linear | Toggles, checkboxes, active states |
| Quick | 150ms | ease-out | Button presses, tab switches, small state changes |
| Standard | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Panels sliding, cards appearing, modals |
| Deliberate | 500ms | cubic-bezier(0.22, 1, 0.36, 1) | Health score reveal, net worth counter, celebration moments |

### 0.2 Microinteraction Rules

- **Every tap/click has a physical response.** Buttons depress 2px on press. Cards lift 4px on hover. Nothing should feel dead.
- **Numbers never jump — they count.** Any time a number changes (net worth, health score, balance), it animates from old value to new. Duration scales with magnitude — a GH¢10 change is 150ms, a GH¢10,000 change is 400ms.
- **Success is always felt.** Confirming a transaction, completing a goal, adding an account — all have a tactile response: haptic on mobile, a soft spring animation on web.
- **Loading is never a blank wait.** Every loading state shows skeleton screens or progress animations. The app never goes dark.
- **Errors are calm, never red alerts.** Error states use amber, not red. Language is always "something went wrong, here's how to fix it" — never "Error 404" or technical messages.

### 0.3 Language & Tone Rules

Every string in the app follows these rules:

- **Always positive framing first.** "GH¢200 remaining" not "GH¢300 spent."
- **Specific over vague.** "Your electricity bill is due in 3 days" not "You have upcoming bills."
- **Conversational, not corporate.** "Nice, your emergency fund is growing!" not "Emergency fund updated successfully."
- **Never blame the user.** If something goes wrong: "We couldn't load that — try again?" not "Invalid request."
- **Celebrate specifically.** "You've saved GH¢500 this month!" not "Goal progress updated."

### 0.4 Global Navigation Behavior

**Web sidebar behavior:**
- Default: expanded (icons + labels, 240px wide)
- On screens under 1280px: collapses to icons only (64px)
- User can manually pin or collapse at any time — preference is saved
- Active section: left border accent, background highlight, bold label
- Hovering a collapsed icon: tooltip shows label + count badge if applicable
- Sub-items expand inline on click, not as a separate navigation event

**Mobile bottom tab behavior:**
- 5 tabs always visible — Home, Money, Wealth, Grow, Advisor
- Active tab: icon fills, label appears, subtle scale up (1.1x)
- Switching tabs: content slides in from the direction of the tab (left tabs = slide right, right tabs = slide left)
- Tab with pending items: small numbered badge appears on icon
- Long press on any tab: shows quick actions for that module

**Global search (web + mobile):**
- Web: CMD+K or click search bar in top nav
- Mobile: pull down from top of any screen
- Results are unified across all modules: transactions, accounts, documents, goals, contacts
- Recents show last 5 searches
- Results appear as you type with 200ms debounce

---

## Part 1 — Home / Command Center

### 1.1 Entry State

**What happens when the user opens the app:**

**Mobile:**
1. App opens to last viewed screen (not always Home — respects where they left off)
2. If it's been more than 4 hours since last open → always returns to Home
3. If there are pending SMS-parsed transactions → a badge appears on the Home tab immediately
4. Background sync fires silently on open — new data loads without interrupting what's on screen
5. If sync finds new data (new parsed transaction, investment update, bill due) → the relevant module tile on Home pulses once with a soft glow

**Web:**
1. Opens to Home always (it's a deliberate session, not a quick glance)
2. Top banner shows date and a greeting that changes based on time: "Good morning," "Good afternoon," "Good evening"
3. Sync fires on load — a tiny spinning indicator appears in the top bar for 1–3 seconds, then disappears
4. If there are items requiring attention (pending transactions, expiring insurance, overdue invoice) → Today's Briefing section loads these first

---

### 1.2 Health Score — The Hero Element

**The Score Circle (mobile: top center, web: top-left panel)**

**Default state:**
- A circular arc that fills clockwise based on score (0–100)
- The number is large, centered, with the label "Financial Health" below it
- The arc color: 0–39 = warm amber, 40–69 = soft teal, 70–89 = green, 90–100 = deep emerald
- Below the number: a single-line summary that changes with score range:
  - 0–39: "Let's get you on solid ground"
  - 40–59: "You're building momentum"
  - 60–74: "Your finances are in good shape"
  - 75–89: "You're doing really well"
  - 90–100: "Exceptional financial health 🌟"

**User action: Tap/click the score circle**

Triggers: Full health score breakdown screen slides up (mobile: bottom sheet, web: expands to full-width panel)

**Inside the breakdown:**

The breakdown shows 7 components, each as a row:

```
Emergency Fund    ░░░░░░░░░░  14/20  🟡
Debt Management   █████████░  17/20  🟢
Savings Rate      ████████░░  11/15  🟡
Budget Adherence  █████████░  13/15  🟢
Investment Growth ███████░░░  10/15  🟡
Income Stability  ██████░░░░   6/10  🟡
Protection        ███░░░░░░░   3/5   🟠
```

Each row:
- Component name on left
- Animated bar fills from left on first open (Deliberate timing, staggered 80ms per row)
- Score fraction on right
- Color indicator: 🟢 >80%, 🟡 50-80%, 🟠 <50%

**User action: Tap any component row**

Triggers: That row expands inline to show:
- Current status in plain language: "You have 4.2 months of expenses covered. Target is 6 months."
- The exact actions that would improve this score
- A single action button: [Improve this →] which navigates directly to the relevant module

**User action: Tap [Improve this →] on any component**

Triggers: 
- Bottom sheet / panel closes
- Navigation goes directly to the specific section that addresses it (Emergency Fund → Protection tab → Emergency Fund section)
- A soft highlight pulses on the relevant input or section for 2 seconds so they know exactly where to look

**Score Update Behavior:**

When any data changes in the app that affects the score:
1. Score recalculates in background (immediate, no loading state)
2. The circle arc animates to new position (Deliberate timing)
3. The number counts up or down to new value
4. If score crosses a threshold (e.g., goes from 69 to 70, entering "good shape" range): a celebration toast appears at the bottom: "Your score just crossed 70 — your finances are in good shape! 🎉"

---

### 1.3 Module Tiles

**Layout:**
- Web: 2×2 grid + 1 wide Advisor tile
- Mobile: vertical stack of cards, full width, swipeable

**Each tile shows:**
- Module icon + name (top left)
- Primary metric in large type (center)
- Secondary metric or trend in small type below
- Status indicator dot (🟢/🟡/🟠) top right
- If there's something requiring attention: a soft amber glow on the tile border

**Money tile:**
- Primary: "GH¢800 available" (this month's remaining budget)
- Secondary: "GH¢1,970 spent · GH¢430 saved"
- If pending transactions exist: "3 to review" badge appears on tile
- Status: 🟢 if on track, 🟡 if within 20% of total budget, 🟠 if over

**Wealth tile:**
- Primary: "GH¢47,200" (net worth)
- Secondary: "↑ GH¢1,840 this month" (green text, always)
- If net worth went down: "GH¢320 shift this month" (neutral grey, never red)
- Status: always 🟢 unless no accounts have been added (then 🟡 with "Add accounts to track")

**Grow tile (Debt + Goals):**
- Primary: shows whichever is more urgent — debt-free date or nearest goal deadline
- If has debt: "Debt-free: March 2026"
- If no debt: "2 active goals"
- Secondary: nearest goal progress %
- Status: 🟢 if debt ratio healthy, 🟡 if D/I ratio above 30%, 🟠 if above 50%

**Protect tile:**
- Primary: "8/10 Protected"
- Secondary: most urgent item ("Car insurance: 14 days")
- Status: 🟢 if all good, 🟡 if something expiring soon, 🟠 if something expired

**User action: Tap any module tile**

Triggers: Navigation to that module (Standard animation — content slides in from right on mobile, left panel updates on web)

---

### 1.4 Today's Briefing

**Appearance:**
- A card below the tiles (mobile) or top-right panel (web)
- Time-stamped to current date
- Maximum 4 items, ordered by urgency
- Each item is one line with an icon and a tap target

**Item types and their triggers:**

**Type: Bill due soon**
- Appears: when a bill is due within 7 days
- Text: "Electricity bill due in 3 days · GH¢85"
- Icon: 📅
- Tap → navigates to that bill in Money tab → Bills section

**Type: Parsed transaction pending**
- Appears: when SMS parser has unconfirmed transactions
- Text: "3 MoMo transactions to review"
- Icon: 📱
- Tap → opens the pending review sheet (see Money flow)

**Type: Investment action needed**
- Appears: when T-bill or investment matures within 7 days
- Text: "T-bill matures in 3 days · GH¢10,487"
- Icon: 📈
- Tap → navigates to that investment in Wealth tab

**Type: Invoice overdue**
- Appears: when a logged invoice is past due date
- Text: "Acme invoice overdue · GH¢2,500"
- Icon: 📤
- Tap → navigates to Income → Invoices section

**Type: Goal milestone reached**
- Appears: when a goal crosses 25%, 50%, 75%, 100%
- Text: "Phone goal just hit 50%! 🎉"
- Icon: 🎯
- Tap → navigates to that goal → triggers mini-celebration animation

**Type: Insurance expiring**
- Appears: 30 days, 14 days, 7 days, 1 day before renewal
- Text: "Car insurance expires in 14 days · Renew now?"
- Icon: 🛡️
- Tap → navigates to that insurance policy in Protect tab

**Type: Anomaly detected**
- Appears: when spending in a category is 30%+ above the weekly average
- Text: "Transport spending is higher than usual this week"
- Icon: 📊
- Tap → navigates to Insights, filtered to Transport category

**If nothing notable today:**
- Briefing shows: "Quiet day financially. Everything's on track. 🟢"
- Below that, the last week summary in one line: "This week: GH¢420 spent · GH¢200 saved"

**Dismissing a briefing item:**
- Swipe left on any item (mobile) or hover + click × (web)
- Item slides out with Quick animation
- "Remind me tomorrow" option appears for 2 seconds, then fades
- Tapping "Remind me tomorrow" → item returns next day
- If all items dismissed → shows the "quiet day" state

---

### 1.5 Quick Actions Row

**Placement:** Below the briefing (mobile: horizontal scroll, web: below briefing panel)

**Actions and their triggers:**

**[➕ Add transaction]**
- Tap → Quick-add sheet slides up (Standard animation)
- Sheet arrives pre-focused on amount field
- Keyboard opens automatically (mobile)

**[🎙️ Voice input]**
- Tap → Recording state activates immediately
- No intermediate screen — goes straight to recording
- Mic animation starts
- (Full voice flow described in Money section)

**[📸 Snap receipt]**
- Tap → Camera opens (requests permission first if not granted)
- Camera viewfinder appears with overlay guides

**[🔄 Review pending] (only shows if pending count > 0)**
- Has a number badge showing count
- Tap → pending review sheet slides up directly

**[📊 Weekly report] (only shows on Sunday or if report hasn't been viewed)**
- Tap → Weekly report sheet slides up
- Report auto-generated every Sunday at 8pm

---

### 1.6 Net Worth Snapshot (web only — right side of top panel)

**Default state:**
- Large number: GH¢47,200
- Below: trend arrow and change: "↑ GH¢1,840 this month"
- A sparkline (mini line chart) showing last 12 months
- Below sparkline: "↑ GH¢12,200 this year"

**Hover on the sparkline (web):**
- Tooltip appears at cursor position showing: month name + net worth at that point
- "March 2025: GH¢47,200"

**Click on the net worth number:**
- Navigates to Wealth tab → Net Worth section

---

### 1.7 Cashflow & Net Worth Charts (web home, below main panels)

**Two charts side by side:**

Left: 12-month cashflow bars (income vs expense per month, grouped bars)
Right: Net worth timeline (line chart)

**Chart interactions:**
- Hover over any bar/point → tooltip with exact figures
- Click on any month's bar → navigates to Money tab filtered to that month
- Charts have no controls or settings — they're read-only on the home screen
- Detailed interactive charts live in the Insights module

---

## Part 2 — Money Module (Cashflow)

The Money module is the original budget tracker, now living as one module of the larger OS. It covers three things: transaction management, envelope budgeting, and bill tracking.

---

### 2.1 Money Tab Entry

**Entry state:**

The Money tab opens to a summary header + three sub-tabs:

```
[Transactions]  [Budget]  [Bills]
```

The sub-tab persists — if they were on Bills last time, Bills opens first.

**Summary header (always visible at top of Money tab):**

```
March 2025
In: GH¢3,200  ·  Out: GH¢1,970  ·  Left: GH¢1,230
```

On mobile this is a compact single line. On web it's a wider panel with trend arrows.

---

### 2.2 Pending Transaction Review Flow

**This is the most frequent daily interaction in the entire app.**

**Trigger:** SMS parsed transactions are waiting for confirmation.

**Entry points:**
- Tapping the "Review pending" quick action on Home
- Tapping the badge on the Money tab icon
- Tapping a pending briefing item

**The Review Sheet:**

Slides up from bottom (mobile) or appears as a right-side panel (web).

**Single pending transaction state:**

```
╔═══════════════════════════════════════╗
║  Parsed from MTN MoMo SMS  · 2:34 PM ║
║                                       ║
║         GH¢ 120.00                    ║
║                                       ║
║   🏪 Shoprite Accra Mall              ║
║   📂 Food & Groceries                 ║
║   💳 MTN MoMo                         ║
║   📅 Today, March 16                  ║
║                                       ║
║   Note (optional)  [______________]   ║
║                                       ║
║  [✕ Dismiss]        [✓ Confirm]       ║
╚═══════════════════════════════════════╝
```

**User action: Tap [✓ Confirm]**
1. Card springs down with satisfying animation (Quick timing)
2. Haptic feedback (mobile)
3. Toast appears at bottom: "GH¢120 logged to Food ✓"
4. If this is the last pending item: sheet closes automatically, confetti burst of 12 small particles, "All caught up! 🎉" appears for 2 seconds
5. Envelope for Food updates immediately — remaining balance recalculates
6. Home module tile updates
7. Health score recalculates silently in background

**User action: Tap [✕ Dismiss]**
1. Card slides left with Quick animation
2. Small undo toast appears for 4 seconds: "Dismissed. [Undo]"
3. Tapping Undo → card slides back in from left
4. If not tapped → transaction is discarded, no further prompt

**User action: Tap anywhere on the card (not the buttons)**
1. Card expands to edit mode
2. All fields become editable inline
3. Amount field is a large number input — tapping shows numpad
4. Category shows a grid of all categories — tap to change
5. Account shows account selector
6. Date shows a date picker (defaults to today, scrollable calendar)
7. Note field shows text keyboard
8. Two buttons at bottom: [Cancel] and [Save & Confirm]

**User action: Tap [Save & Confirm] after editing**
1. Same flow as Confirm but with updated values
2. The corrected categorization is silently saved as a new merchant rule: "Shoprite = Food" so next time it's auto-categorized

**Multiple pending transactions (2–10):**

Cards stack visually — you can see the edge of the next card behind the current one.

Top of sheet shows: "3 of 7 reviewed" with a thin progress bar.

Navigation: swipe right to confirm (with a green ✓ appearing as you swipe), swipe left to dismiss (with a grey ✕ appearing). The swipe gesture follows the finger — it's not a snap. You can swipe halfway and pull back to cancel.

**Multiple pending — Confirm All button:**

At the top of the stack when 3+ are pending: "Confirm all" button appears. This is for when all parsed transactions look correct and the user just wants to clear them fast.

Tap [Confirm all]:
1. Brief confirmation dialog: "Confirm all 7 transactions?" with a tiny preview of amounts and merchants → [Yes, confirm all] [Review one by one]
2. If confirmed: all cards animate downward in sequence, 100ms apart — looks like a satisfying cascade
3. Toast: "7 transactions logged ✓"

**First-time merchant — category unclear:**

When confidence is below 90%, the category field shows with a soft amber highlight:

```
📂 [?] Not sure about this category
       Is this Food or Transport?
       [🍔 Food]  [🚗 Transport]  [See all]
```

User taps the correct category → card updates → confirmation proceeds. This choice is saved forever for that merchant.

**Duplicate detection:**

If the app detects a transaction matching the same amount + merchant within 2 hours of an existing one:

```
⚠️  This looks like a duplicate

   GH¢120 · Shoprite · 2:34 PM
   
   You already have:
   GH¢120 · Shoprite · 2:31 PM
   
   [Skip this one]   [Keep both]
```

---

### 2.3 Manual Transaction Entry (Quick-Add)

**Trigger:** FAB (floating action button) tap, Quick action on Home, or keyboard shortcut N (web).

**The sheet / modal:**

```
How much?

      GH¢ [        ]
      
      (numpad on mobile, keyboard on web)

What for?

  [🍔 Food]     [🚗 Transport]  [📱 Airtime]
  [🏠 Rent]     [💡 Utilities]  [🎯 Savings]
  [+ More categories]

Merchant  (optional)
[_________________________]

Account
[MTN MoMo ▼]   (shows most recently used)

Date
[Today ▼]

                    [Save]
```

**As they type the amount:**
- The number displays in large type
- Category chips become tappable (they were slightly muted before amount was entered)
- No validation until they try to save

**User taps a category:**
- Chip highlights with a satisfying press animation
- Previously selected chip deselects simultaneously
- No confirmation needed — one tap selects

**User taps [+ More categories]:**
- Chips expand to show all categories (or scroll to show more)
- A search field appears at the top: "Search categories..."
- Typing filters instantly

**User taps [Date]:**
- Dropdown shows: Today / Yesterday / [Pick date]
- Today and Yesterday are one tap
- Pick date opens a compact calendar sheet
- Calendar defaults to current month, can scroll months
- Future dates are disabled (can't log future spending)

**User taps [Save]:**
- Validation: if no amount entered → amount field shakes + pulses (Instant timing), no toast
- Validation: if no category → categories section pulses once
- If valid: sheet slides down (Standard timing)
- Toast appears: "GH¢45 added to Food ✓"
- If the transaction puts the envelope within 20% of its limit: toast extends with "GH¢30 left for Food this month" — informational, not alarming
- If the envelope is at 0%: toast says "Food envelope is now empty — you can move some money from another envelope if you need" with [Adjust] button

**Income transaction:**
- A toggle at the top of the sheet: [Expense ↕ Income]
- Switching to Income: category chips change to income types (Salary, Freelance, Business, Other)
- Amount shows in green in preview
- Account selector changes to "Deposit to: [account]"
- Save → transaction logged as income, total monthly income updates, net worth updates

---

### 2.4 Voice Input Flow

**Trigger:** Holding the FAB, tapping mic in quick-add sheet, or mic icon in top bar.

**State 1 — Activating:**
- Screen dims to 40% opacity
- A large pulsing circle appears center screen (mobile) or center of content area (web)
- Text appears above circle: "Listening..."
- Circle pulses in sync with detected audio input levels

**State 2 — User speaks:**
- Waveform animates inside the circle responding to voice volume
- Text updates to show partial transcription as they speak (if on-device transcription available)
- Example: "Spent fifty..." appears in real time

**State 3 — Silence detection (1.5 seconds of silence):**
- Recording stops automatically
- Circle animation freezes then shrinks
- Text: "Got it, one moment..."

**State 4 — Processing (Whisper + Claude):**
- A subtle spinner replaces the circle
- Usually 1–3 seconds
- If connection is slow: "Processing your voice note..."

**State 5 — Result:**
- Quick-add sheet slides up pre-filled with parsed values
- Parsed fields have a soft blue highlight showing they were filled by voice
- If confidence is high: "We heard: Spent 50 cedis on fuel at Shell" appears above the form
- User can edit any field before saving
- If everything looks right: they tap Save — 2-tap total interaction (mic + save)

**Voice error states:**

Too quiet: "We didn't catch that. Try speaking closer to your phone, or type it instead?" → [Try again] [Type instead]

Unclear: "We heard something but couldn't make out the details. What were you trying to log?" → pre-filled sheet with whatever was understood, rest blank

No connection: "Voice input needs internet. Add it manually?" → opens standard quick-add sheet

---

### 2.5 Receipt OCR Flow

**Trigger:** Camera icon in quick-add sheet, or holding FAB → "Snap receipt."

**State 1 — Camera opens:**
- Viewfinder with a soft white border rectangle overlay: "Point at the receipt"
- Auto-capture mode: when camera detects a flat document-like image → captures automatically (with a soft shutter sound + flash)
- Manual shutter button also always visible

**State 2 — Processing:**
- Photo freezes in viewfinder
- A scanning line animates across the image (visual feedback that it's reading)
- "Reading your receipt..." text

**State 3 — Result:**
- Quick-add sheet slides up with extracted data
- Amount field pre-filled and highlighted in blue
- Merchant pre-filled if readable
- Date pre-filled if visible on receipt
- A small thumbnail of the receipt photo sits at the top of the sheet
- User reviews, edits anything wrong, saves

**State 4 — Save:**
- Receipt image is attached to the transaction
- Stored in Supabase storage
- Linked in Document Vault automatically under Receipts folder
- Transaction appears in history with a 📷 icon indicating it has a receipt attached

**OCR error states:**

Blurry image: "We couldn't read this clearly. Try again in better lighting?" → [Retake] [Enter manually]

No amount found: "We found the receipt but couldn't read the total. What was the amount?" → sheet opens with only amount blank, rest pre-filled

Multiple amounts on receipt: "We found a few numbers. Which was the total?" → shows 2-3 detected amounts as large tappable buttons → user taps the correct one

---

### 2.6 Transactions List

**Default view:**
- Chronological, newest first
- Grouped by date (Today, Yesterday, March 14, March 13...)
- Each transaction row:
  - Left: category icon in a colored circle
  - Center-left: merchant name (bold) + category name (small, muted)
  - Center-right: source icon (📱 SMS, 🎙️ Voice, 📸 Receipt, ✏️ Manual)
  - Right: amount (expenses muted dark, income green)

**Mobile row interactions:**

Tap → transaction detail sheet slides up
Swipe left → reveals [Edit] [Delete] actions (quick action buttons appear)
Swipe right → reveals [Duplicate] (useful for recurring cash payments)

**Web row interactions:**

Click → row expands inline to show full details + edit fields
Hover → row highlights, edit (pencil) and delete (trash) icons fade in on right
Keyboard: when a row is expanded, Tab navigates between fields, Enter saves, Escape closes

**Transaction detail view (full):**

```
GH¢ 120.00
Food & Groceries  ·  Expense

Merchant:     Shoprite Accra Mall
Account:      MTN MoMo
Date:         March 16, 2025  2:34 PM
Logged via:   SMS auto-parse
Note:         —

Receipt:      [No receipt attached]  [Add receipt 📸]

[Edit transaction]   [Delete]   [×]
```

**Edit transaction:**
All fields become editable. Saving re-runs the envelope calculation and health score update.

**Delete transaction:**
Confirmation: "Delete this GH¢120 transaction? This can't be undone." → [Delete] [Cancel]
On delete: row slides out, envelope recalculates, toast: "Transaction deleted. [Undo]" with 5-second undo window.

**Filtering (web: filter bar at top, mobile: filter icon → sheet):**

Available filters:
- Date range (presets: This week, This month, Last month, Custom)
- Category (multi-select chips)
- Account (multi-select)
- Amount range (min/max sliders)
- Source (SMS / Manual / Voice / Receipt)
- Type (Expense / Income)

Applied filters show as chips below the search bar. Each chip has an × to remove. "Clear all" removes all filters.

**Search:**

Real-time search as they type (200ms debounce).
Searches: merchant name, category name, note field, amount (exact or partial).
Highlighting: matching text is highlighted in search results.
No results: "No transactions match '[query]'" with a soft illustration.

---

### 2.7 Budget / Envelopes

**Entry state:**

Top: month selector with ← → arrows.
Switching month: content slides in the direction of navigation (next month slides from right).

Total budget health at top:
```
March 2025  ·  GH¢3,200 income

████████████░░░░░░░░  GH¢1,970 of GH¢2,350 spent
GH¢380 unspent  ·  GH¢850 unallocated
```

Below: list of all envelopes.

**Envelope row:**

```
🍔 Food
████████████████░░░░  GH¢420 / GH¢600
GH¢180 remaining
```

Color of the progress bar:
- 0–50% spent: green
- 51–75%: green fading to amber
- 76–90%: amber
- 91–100%: deep amber (never red)
- 100%+: bar stays full, a soft "empty" indicator appears

**Tap an envelope row:**

Expands to show (mobile: new screen, web: inline expansion):

1. Day-by-day spend chart — a compact bar chart showing spending per day this period
2. All transactions in this envelope this period (scrollable mini-list)
3. Edit controls: [Adjust limit] [Move money] [View all transactions →]
4. Trend line: "Last month you spent GH¢510 on Food"

**[Adjust limit] flow:**

A slider appears with the current limit marked.
Dragging left: limit decreases, "freeing" GH¢X back to unallocated
Dragging right: limit increases, consuming from unallocated pool
If unallocated is 0 and they try to increase: "Take GH¢50 from which envelope?" → envelope selector appears
Live preview as they drag: "New limit: GH¢550 · GH¢50 freed up"
Tap [Done] → saves, progress bar updates with smooth animation

**[Move money] flow:**

```
Move money between envelopes

From:  [Food  GH¢180 remaining  ▼]
To:    [Transport  GH¢95 remaining  ▼]
Amount: GH¢ [____]

Both balances preview below as they type.

[Move it]
```

Confirming: both envelopes animate their progress bars simultaneously to new values.
Toast: "GH¢50 moved from Food to Transport ✓"

**Creating a new envelope:**

Tap [+ Add envelope] at bottom of list.

```
New envelope

Name: [________________]
Icon: [🍔] [🚗] [📱] [🏠] [💡] [🎯] [+ custom]
Monthly limit: GH¢ [______]
Color: [● ● ● ● ●]  (5 color choices)
Rollover: [Toggle] (unused budget carries to next month)
Period: [Monthly ▼]  (or Weekly / Custom)
```

Tap [Create] → envelope slides into the list with a spring animation.

**Period-end rollover behavior:**

On the first day of a new period, the app detects the reset.
A card appears on Home: "New month! Here's your budget reset."

```
March wrapped up. Here's what happened:

Food:      GH¢180 unused  →  rolled over ✓
Transport: GH¢95 unused   →  rolled over ✓
Airtime:   GH¢0 unused    →  nothing to roll over
Savings:   GH¢400 saved   →  moved to savings account ✓

Your April budget is ready with suggested limits
based on March patterns.

[Review April budget →]  [Looks good, go →]
```

---

### 2.8 Bills

**Entry state:**

Bills are grouped into two sections:
- Upcoming (next 30 days, sorted by due date)
- All bills (complete list, alphabetical)

**Bill row:**

```
💡 Electricity
Due in 3 days · GH¢85
ECG  ·  Monthly
[Pay now →]
```

Color of the due-date text:
- 8+ days: muted grey
- 4–7 days: amber
- 1–3 days: deep amber (never red)
- Overdue: "OVERDUE" badge in amber

**Tap a bill row:**

Expands to show:
- Full payment history (last 6 months)
- Average amount
- Next 3 due dates
- Edit controls

**[Pay now →] action:**

This doesn't make an actual payment. It marks the bill as paid and opens quick-add pre-filled:

```
Mark as paid

💡 Electricity  ·  GH¢85
Paid from: [MTN MoMo ▼]
Date: [Today ▼]
Actual amount: [GH¢ 85] (editable — actual bill may differ)

[Confirm payment ✓]
```

Confirming: bill marked paid, transaction logged to appropriate envelope (Utilities), next due date calculated and shown: "Next due: April 16."

**Adding a bill:**

Tap [+ Add bill]

```
Bill name: [_______________]
Category:  [💡 Utilities ▼]
Amount:    [GH¢ ______]  [This varies month to month]
Due:       Day [__] of the month
           or  [Specific date]
           or  [Weekly on ____]
Remind me: [3 days before ▼]
Account:   [MoMo ▼]  (default payment source)
```

If they tap [This varies month to month]: amount field becomes "Approx. amount" with a note "We'll ask you to confirm each month."

Save → bill appears in upcoming list, reminder is scheduled.

---

## Part 3 — Wealth Module

### 3.1 Wealth Tab Entry

**Sub-tabs:**
```
[Overview]  [Accounts]  [Investments]  [Susu]
```

**Overview shows:**
- Net worth number (large, animated on entry)
- Assets vs liabilities breakdown
- 12-month net worth chart
- Allocation donut chart

---

### 3.2 Net Worth Overview

**The Net Worth Number:**

On first entry to Wealth tab each session: the number animates counting up from slightly below its value (Deliberate timing, 500ms). This makes the number feel alive rather than static.

**The chart (12 months):**

Line chart with two areas:
- Solid line: actual net worth each month
- Dotted line extending to the right: projected net worth based on current savings rate

The projected dotted line is subtle — it's informational, not a promise. Hovering/tapping any point shows the exact value and month.

A horizontal "zero line" shows if they have or are approaching positive net worth. For new users starting with debt, the chart starts below zero and the goal is to cross the line.

**Allocation donut chart:**

Color-coded by asset type:
- Liquid (cash, MoMo, bank): teal
- Investments (mutual funds, T-bills, stocks): emerald
- Property: warm amber
- Crypto: purple
- Other: grey

Center of donut: shows the total of whichever segment is selected, or total assets when nothing is selected.

Tapping a segment: that segment lifts slightly (scale 1.05), center shows that category's total + % of portfolio, list below filters to that category.

**Liabilities section:**

Below assets:
```
LIABILITIES                    GH¢5,200
────────────────────────────────────────
🏛️ Bank Loan                  GH¢4,000
👥 Kofi (personal)            GH¢1,200
```

Liabilities are displayed in neutral dark colour, not red. The section is visually de-emphasized relative to assets — smaller font for the section label, no color coding.

---

### 3.3 Accounts

**Account list:**

Grouped by type:
- Liquid (cash + mobile money + bank)
- Savings
- Investments
- Foreign currency

Each account card:
```
🏦 GCB Account
GH¢8,200
Updated today  ·  ● Synced
```

The update recency indicator:
- "Updated today": green dot
- "Updated 3 days ago": amber dot — prompts gentle update
- "Updated 14+ days ago": amber dot + "Needs update" text

**Tap an account:**

Slides to account detail view.

```
GCB Account
GH¢ 8,200
────────────────────────────────────────
[Transactions]  [Details]  [Settings]
```

Transactions tab: all transactions from this account, same list UI as Money module but filtered to this account.

Details tab: account number (masked), bank name, account type, date added, linked bills.

Settings tab: rename account, change icon/color, archive account, delete account.

**[Update balance] button (top right of account detail):**

A compact input slides down below the balance:
```
GH¢ [8,200]  ← editable, pre-filled with current balance
              [Update ✓]
```

They type new balance, tap Update. Old balance fades out, new balance counts up (Deliberate timing). Net worth updates in real time. A tiny history line appears: "Previous: GH¢7,800 · March 10"

**Adding an account:**

Tap [+ Add account] on the accounts list.

Step 1: Account type selection (full-width cards):
```
[📱 Mobile Money]    [🏦 Bank Account]
[💰 Cash]            [💳 Credit Card]
[📈 Investment Acc]  [🌍 Foreign Currency]
[📦 Other]
```

Step 2: Depends on type selected.

For Mobile Money:
```
Network: [MTN ▼]  (MTN / Vodafone / AirtelTigo)
Name: [My MoMo] (pre-filled, editable)
Current balance: GH¢ [_____]

[Connect SMS auto-sync 📱]  ← if SMS not yet enabled
```

For Bank Account:
```
Bank: [GCB ▼]  (searchable dropdown of all Ghanaian banks)
Account type: [Savings ▼] / Current / Fixed deposit
Name: [Main Account]
Current balance: GH¢ [_____]
Account number (optional): [_____________] (stored encrypted)
```

For Foreign Currency:
```
Currency: [USD ▼]  (searchable currency list)
Account name: [Dollar Account]
Balance: $ [_____]
         = GH¢ [calculated live at current rate]
Rate source: Updated daily from Bank of Ghana rate
```

Save → account slides into the list, net worth counter animates upward, a small toast: "GCB Account added · Net worth updated ✓"

**Transferring between accounts:**

Tap ⇄ icon on any account → or tap [Transfer] in account detail.

```
Transfer

From: [GCB Account  GH¢8,200 ▼]
To:   [MTN MoMo    GH¢1,200 ▼]

Amount: GH¢ [_____]

After transfer:
GCB Account → GH¢7,700
MTN MoMo   → GH¢1,700

           [Transfer ✓]
```

Confirming: both balances animate simultaneously. A single transfer record is created (not an expense or income — correctly logged as a transfer). Net worth stays the same (money moved, not spent).

---

### 3.4 Investments

**Investment list:**

Each investment card:
```
📜 Treasury Bills
GH¢10,000  ·  +GH¢487 (5.1%)
Matures June 14 · 89 days
[████████████████░░░░]  82% to maturity
```

The maturity progress bar shows time elapsed, not money. A visual way to see how close they are to getting their money.

Color of return: green for positive, grey/neutral for negative (never red).

**Tap an investment:**

Detail view:
```
Treasury Bills

Institution:    Bank of Ghana
Amount invested: GH¢9,513
Current value:   GH¢10,000
Interest earned: GH¢487 so far
Rate:            20% annualised
Start date:      September 1, 2024
Maturity date:   June 14, 2025

Expected at maturity: GH¢10,487

[Edit]  [Set reminder]  [Mark as closed]
```

**[Set reminder]:** Creates a reminder 3 days before maturity (pre-selected) with options for 7 days, 14 days, or custom.

**[Mark as closed]:** Used when the investment matures and the money has been received.

Flow:
```
Mark Treasury Bills as closed?

Date closed: [June 14 ▼]
Amount received: GH¢ [10,487]  (pre-filled, editable)
Where did the money go?
  [📱 MTN MoMo]  [🏦 GCB Account]  [Reinvested]

[Close investment ✓]
```

If "Reinvested" is selected → quick-add investment form opens pre-filled with the received amount so they can immediately log the reinvestment.

**Adding an investment:**

Tap [+ Add investment]

Investment type selection:
```
[📜 Treasury Bill / Bond]
[📈 Mutual Fund / Unit Trust]
[🏢 Stocks / Shares]
[🪙 Crypto]
[🤝 Susu]
[📦 Fixed Deposit]
[🏠 Real Estate]
[💰 Other]
```

**Treasury Bill flow:**
```
Treasury Bill

Institution: [Bank of Ghana ▼]
Amount invested: GH¢ [_______]
Interest rate: [____%]  annualised
Duration: [91 days ▼]  (or 182 / 364 / custom)
Start date: [Today ▼]

At maturity you'll receive:
GH¢ [calculated]  on [calculated date]

Remind me before maturity?  [✓ Yes, 3 days before]

[Add investment ✓]
```

The maturity amount and date calculate live as they type. Seeing "You'll receive GH¢10,487 on June 14" is motivating — it makes the investment feel real and worth doing.

**Susu flow (Ghana-specific):**

```
Susu Group

Group name: [______________]
Your weekly contribution: GH¢ [_____]
Total members: [___]
Your position (payout week): [___] of [___]
Collector name (optional): [______________]
Start date: [____]

Expected payout: GH¢ [calculated]
Your payout date: [calculated]

[Add Susu ✓]
```

The app calculates expected payout (weekly contribution × total members) and the approximate payout date based on position.

Reminder is auto-set for 1 week before payout: "Your susu payout is next week — GH¢2,400 incoming! 🎉"

And for contribution day (if weekly): gentle reminder on contribution day.

---

## Part 4 — Grow Module (Debt + Goals + Tax)

### 4.1 Grow Tab Entry

Sub-tabs:
```
[Debt]  [Goals]  [Tax]
```

---

### 4.2 Debt Intelligence

**Overview panel (top of Debt tab):**

```
Total Debt: GH¢5,200
────────────────────────────────────────
Debt-free: March 2026  🟢
D/I Ratio: 8.7%  (Healthy)
Interest paid this year: GH¢420
```

The debt-free date is the headline — forward-looking, not the scary total.

D/I ratio color: 🟢 under 30%, 🟡 30–50%, 🟠 over 50%.

Below overview: the debt list.

**Debt row:**
```
🏛️ Consolidated Bank Loan
GH¢4,000 remaining  ·  22% rate
[████████████░░░░░░░░]  62% paid off
Monthly payment: GH¢400  ·  12 months left
```

Progress bar shows percentage paid off (not remaining). "62% paid off" feels better than "38% left."

**Tap a debt row:**

Detail view:
```
Consolidated Bank Loan

Lender:          GCB Bank
Original amount: GH¢10,500
Remaining:       GH¢4,000
Interest rate:   22% per annum
Monthly payment: GH¢400
Next payment:    March 25 (in 9 days)
Debt-free:       March 2026

[Payment history ▼]
[Edit details]  [Record payment]  [Mark as paid off]
```

**[Record payment]:**

```
Record payment

Amount: GH¢ [400]  (pre-filled, editable)
Date: [Today ▼]
Paid from: [GCB Account ▼]

[Record ✓]
```

After recording: remaining balance updates, debt-free date recalculates, progress bar animates forward. If this was the last payment: special flow (see Mark as paid off below).

**[Mark as paid off]:**

```
🎉 Paid off Consolidated Bank Loan!

Total paid: GH¢10,500
Interest paid: GH¢840
Time taken: 26 months

You're debt-free of this loan.
Your monthly cashflow just freed up GH¢400.

Want to redirect that GH¢400 somewhere?
[Put it in savings]  [Pay down another debt]
[Just close this]
```

This is a full celebration moment — a debt being paid off is a major life win.

**Payoff Strategy Panel:**

Below the debt list, a strategy panel:

```
Your Payoff Strategy

Current: Minimum payments only
Debt-free: March 2026
Total interest: GH¢840

────────────────────────────────────
Avalanche (fastest, cheapest):
Pay highest interest rate first.
Debt-free: January 2026 ← 2 months sooner
Interest saved: GH¢340

[Switch to Avalanche ✓]

────────────────────────────────────
Snowball (most motivating):
Pay smallest balance first.
Debt-free: February 2026 ← 1 month sooner
Interest saved: GH¢180

[Switch to Snowball]
```

Switching strategy: the debt list re-orders to show which debt to focus on first, with a banner: "Focus here: Consolidated Loan (highest rate). Pay minimums on all others."

**Extra Payment Simulator:**

```
What if I paid GH¢[____] extra per month?

GH¢100 extra → debt-free October 2025 (5 months sooner) · save GH¢580
GH¢200 extra → debt-free July 2025 (8 months sooner) · save GH¢720

[Add GH¢100 to my monthly plan]
```

The simulator calculates live as they type. The numbers shift in real time. [Add to plan] creates a bill reminder for the extra payment amount.

**Adding a debt:**

```
What kind of debt?

[🏛️ Bank / Formal Loan]   [👥 Personal / Family]
[💳 Credit Card]           [🏠 Mortgage]
[📱 Buy Now Pay Later]     [Other]
```

For Bank Loan:
```
Lender: [______________]
Original amount: GH¢ [_______]
Outstanding balance: GH¢ [_______]
Interest rate: [____]% per year
Monthly payment: GH¢ [_______]
Payment date: Day [__] of month
Start date: [______]

Debt-free date: [calculated]  → shown live
Total interest remaining: [calculated]

[Add debt ✓]
```

For Personal/Family loan:
```
Owed to: [______________]  (person's name)
Amount: GH¢ [_______]
Interest rate: [0%]  (editable — some family loans have interest)
Regular payment: GH¢ [_______]  (or: no fixed amount)
Notes (optional): [______________]
```

No judgment on personal loans. The "no fixed amount" option acknowledges that family debt is informal. A simple [Record payment] button is the main interaction.

---

### 4.3 Goals

**Goals list:**

Each goal is a card:

```
📱 New Phone
GH¢450 of GH¢1,200 · 37%
[██████████░░░░░░░░░░░░░░░░░░]
On track · GH¢150/month → done in 5 months
```

The progress bar is thick (8px on mobile) and satisfying to see fill.

**Status text below bar:**
- On track: "On track · done in [X] months"
- Behind: "A bit behind · add GH¢X/month to hit your deadline"
- No deadline set: "Add GH¢X/month to hit this in [X] months"
- Past deadline (if set): "Deadline passed · still going — [X]% there"

**Tap a goal:**

Detail view:
```
📱 New Phone

Target:    GH¢1,200
Saved:     GH¢450
Remaining: GH¢750

Deadline:  August 2025  (editable)

At GH¢150/month → done in 5 months ✓
At GH¢200/month → done in 4 months

[Adjust contribution]  [Add money now]  [Edit goal]

Progress history:
[Bar chart showing monthly contributions]
```

**[Add money now]:**

Quick-add for a manual contribution:
```
Add to Phone Fund

Amount: GH¢ [_____]
From: [MTN MoMo ▼]

[Add ✓]
```

On save: the goal's progress bar fills with a smooth animation. If this contribution hits a milestone (25%, 50%, 75%, 100%): full celebration screen activates.

**Milestone celebration:**

Full screen takeover (not a modal — full screen):
- Background: animated particles in the goal's color
- Large emoji of the goal bounces in
- Text: "Halfway to your new phone! 📱"
- Sub-text: "You've saved GH¢600. Keep it up!"
- Option to share: "Share this win 💪" → generates a shareable image card (for WhatsApp/social)
- [Continue →] button dismisses

**Goal complete (100%):**

```
[Full screen celebration]

🎉 You did it!

New Phone goal: Complete!

Started: October 2024
Completed: March 2025
Total saved: GH¢1,200

[Archive this goal]  [Set a new goal]
```

Archived goals are kept in a "Past wins" section — they're achievements, not trash.

**Adding a goal:**

Step 1: Goal type selection

```
What are you saving for?

[📱 Device / Gadget]   [✈️ Travel]
[🏠 Property]          [🚗 Vehicle]
[🎓 Education]         [💍 Life Event]
[🛡️ Emergency Fund]   [🏖️ Retirement]
[📦 Something else]
```

Step 2: Goal details (adapts per type)

For generic goal (Device):
```
Goal name: [New iPhone ___________]
Target amount: GH¢ [_________]
Deadline (optional): [__________ ▼]
Icon: [📱] (or choose from grid)

Monthly contribution:
  To hit by [deadline]: GH¢[calculated] / month
  Or I'll contribute: GH¢[_____] / month

Create an envelope for this? [✓ Yes]
(We'll track your contributions automatically)

[Create goal ✓]
```

If envelope is created → a new envelope appears in the Budget section labeled with the goal name. Contributions logged to that envelope count toward the goal.

For Retirement goal:
```
Current age: [___]
Target retirement age: [55 ▼]

Estimated monthly expenses in retirement:
GH¢ [_______]
(We'll adjust for inflation automatically)

Current retirement savings: GH¢ [_______]
Monthly contribution: GH¢ [_______]

At this rate:
Projected by age 55: GH¢[calculated]
Target needed: GH¢[calculated]
Gap: GH¢[calculated]

[Show me the plan →]  [Adjust age]  [Create anyway]
```

The retirement goal creates a long-term projection. [Show me the plan →] opens the AI Advisor with a pre-loaded retirement planning conversation.

---

### 4.4 Tax Center

**Overview panel:**

```
Tax Year 2025
────────────────────────────────────────
Total income (so far): GH¢15,000
Estimated tax: GH¢1,697
Effective rate: 11.3%

Business deductions tracked: GH¢1,200
Potential tax saving: ~GH¢132

Next filing: April 30, 2026  ·  [Set reminder]
[Export for accountant]
```

**Monthly breakdown table (web: full table, mobile: scrollable cards):**

| Month | Income | Deductible | Taxable | Est. Tax |
|---|---|---|---|---|
| January | GH¢3,400 | GH¢0 | GH¢3,400 | GH¢318 |
| February | GH¢4,200 | GH¢400 | GH¢3,800 | GH¢367 |
| March | GH¢7,400 | GH¢800 | GH¢6,600 | GH¢1,012 |

High-income months are highlighted with a subtle amber — not alarming, just informational. "March was a big month — consider setting aside GH¢1,012 for tax."

**Business expense toggle (in transaction entry):**

When logging any transaction, a small toggle at the bottom of the quick-add sheet: "Business expense 📋" — off by default.

Turning it on: transaction is tagged as deductible. Tax center accumulates these automatically. No double entry.

**[Export for accountant] button:**

```
Export Tax Summary

Format:
  ○ PDF report (recommended for accountant)
  ○ CSV spreadsheet (for your own records)

Date range:
  ○ Full year 2025
  ○ January to March (year to date)
  ○ Custom range

What to include:
  [✓] Income summary
  [✓] Expense breakdown
  [✓] Business deductions
  [✓] Tax estimate
  [ ] Individual transactions

[Generate & download]
```

The PDF export is beautifully formatted — professional enough to hand to an accountant. Letterhead with app name, user's name, tax year, all figures cleanly laid out.

---

## Part 5 — Protect Module

### 5.1 Protect Tab Entry

**Protection Score:**

```
Protection Score: 8/10  🟢

Your finances are well protected.

Emergency Fund    ✅  4.2 months
Health Insurance  ✅  Active
Car Insurance     ⚠️  Expires in 14 days
Life Insurance    ❌  Not tracked
Home Insurance    ❌  Not tracked
```

The score is out of 10, not 100 — keeps it approachable. Each protection area has a status indicator.

✅ = sorted and current
⚠️ = needs attention (expiring soon, or target not met for emergency fund)
❌ = not tracked (invitation to add, never a failure state)

**Tap any status indicator row:**
- ✅ rows: expand to show current details
- ⚠️ rows: expand to show what needs attention + action button
- ❌ rows: expand to show why it matters + [Add coverage →] button

---

### 5.2 Emergency Fund

**Emergency Fund section:**

```
Emergency Fund

Saved: GH¢5,040
Target: GH¢7,200  (6 months of expenses)

Your monthly expenses: GH¢1,200
  (calculated from last 3 months automatically)

[████████████████░░░░░░░░]  70%

At GH¢200/month → full in 11 months
At GH¢400/month → full in 5 months  ← Recommended

[Set monthly contribution →]
```

Target is auto-calculated from actual spending data — not a generic number. If spending changes significantly, target recalculates and a gentle note appears: "Your expenses changed — we've updated your emergency fund target."

**[Set monthly contribution →]:**

Opens envelope creation: creates an "Emergency Fund" envelope with the chosen monthly amount. Contributions to this envelope increment the emergency fund tracker automatically.

**Fund is full (100%):**

```
🎉 Emergency Fund Complete!

You have 6 months of expenses covered.
That's a serious achievement.

Your financial health just got
a lot more secure.

Score impact: +12 points 🟢
```

After that, the emergency fund section shows "Fully funded ✅" and the contribution envelope is paused (no new contributions needed unless expenses grow and target increases).

---

### 5.3 Insurance Tracker

**Insurance list:**

```
🚗 Car Insurance
Expires March 30  ·  14 days  ⚠️
Provider: Hollard · GH¢480/year
[Renew →]  [View policy]

🏥 Health Insurance
NHIS + Company Plan
Renews November 2025  ·  Active ✅
Coverage: GH¢50,000

📱 Device Insurance
iPhone 14 · GH¢45/month
Renews April 1 · 15 days ⚠️
[Renew →]  [View policy]
```

**[View policy]:** Opens the linked policy document in Document Vault (if uploaded) or shows manual details.

**[Renew →]:** Not a payment action. Opens a reminder creation screen: "When you've renewed, tap here to update the expiry date." Also optionally opens the provider's website or app.

After renewal:
```
Renewed! New expiry date?
[March 30, 2026]  (pre-filled with +1 year)
[Update ✓]
```

**Adding an insurance policy:**

Type selection:
```
[🏥 Health]     [🚗 Car / Motor]
[🏠 Home]       [❤️ Life]
[📱 Device]     [✈️ Travel]
[💼 Business]   [Other]
```

For Car Insurance:
```
Provider: [______________]
Policy number: [______________] (optional — for reference)
Coverage amount: GH¢ [_______]
Premium: GH¢ [_____] per [year ▼]
Renewal date: [__________]
Vehicle: [______________] (optional)
Beneficiary: [______________] (optional)

Upload policy document: [📎 Attach file]

[Add policy ✓]
```

On save:
- Policy appears in insurance list
- Document (if uploaded) is stored in Vault under Insurance folder
- Reminders auto-set: 30 days, 14 days, 7 days, 1 day before renewal
- Protection score updates immediately

---

## Part 6 — Advisor Module

This is the most powerful feature in the entire OS. The AI Advisor is not a chatbot — it's a financial advisor with full context of everything in the system.

### 6.1 Advisor Entry

**Web layout:**

Split screen — left: conversation, right: live financial snapshot panel (always visible, updates as discussed).

**Mobile layout:**

Full screen conversation. A small "My snapshot" button at top right collapses to show their key numbers.

**Opening state:**

```
Hey [Name] 👋

I have your complete financial picture.
Ask me anything.

───────────────────────────────────
📊  Your snapshot right now:
    Health Score: 74
    Net Worth: GH¢47,200
    This month: GH¢800 left
    Debt-free: March 2026
───────────────────────────────────

Try asking:
"Can I afford to take a loan right now?"
"How long until I'm debt free?"
"Should I invest or pay off debt first?"
"What should I focus on this month?"
"How do I improve my health score?"
```

Suggested questions change daily based on what's happening in their finances:
- Bill due soon → "When's my next big expense?"
- Just got paid → "How should I allocate this month's salary?"
- Goal close to deadline → "Will I hit my [goal] by [date]?"
- Investment maturing soon → "What should I do with my T-bill when it matures?"

---

### 6.2 Asking a Question

**User types a question:**

Typing indicator shows immediately (Instant timing). The advisor sees the question.

**Processing indicator:**

A subtle three-dot animation appears. Text below: "Thinking..." This takes 2–5 seconds typically. The "thinking" state is calm, not anxious.

**Response appears:**

Text streams in word by word (like typing). This is intentional — it feels like the advisor is thinking and responding, not a database lookup.

**Response structure:**

Every advisor response follows this structure:
1. Direct answer to the question (first sentence — don't bury the lead)
2. The key numbers from their actual data that support the answer
3. A recommendation or path forward
4. An optional action button ([Do this →]) if there's a concrete action

**Example — "Can I afford a GH¢35,000 car right now?"**

```
Advisor:

Directly? It's possible, but the timing 
could be better. Here's your picture:

💰 Liquid cash: GH¢13,700
   Buying outright would leave you with 
   only GH¢700 — dangerously tight.

🏦 Loan option (GH¢35,000 · 22% · 3 years):
   Monthly: ~GH¢1,340
   Your free cashflow: GH¢800/month
   Gap: GH¢540/month — too stretched.

📅 What I'd suggest:
   Save aggressively for 8 months.
   At GH¢600/month → GH¢18,000 down payment
   Loan then: GH¢17,000 · Monthly: ~GH¢650
   That's within reach on your current cashflow.

Want me to set up a Car Fund goal 
with GH¢600/month? It maps out the 
whole path for you.

[Yes, create Car Fund goal →]   [Show me other options]
```

**[Yes, create Car Fund goal →]:**

The goal creation flow opens pre-filled with the advisor's suggested amounts. The conversation continues: "Car Fund created. You're 0% there — let's get it started."

**[Show me other options]:**

Advisor continues with 2 alternative approaches:
- Option A: wait longer and save more
- Option B: find a lower-cost car

The conversation continues naturally. Previous messages stay visible, scrollable up.

---

### 6.3 Advisor Proactive Alerts

These are messages the advisor initiates — appearing as cards on the Home screen or as a push notification. Never more than 2 per day. Never repetitive.

**Salary received (detected via SMS):**

```
Advisor 💬

Your GH¢3,000 salary just arrived.

Based on your plan:
→ GH¢600 to Emergency Fund (you're 70% there)
→ GH¢400 to loan payment
→ GH¢200 to Phone goal
→ GH¢1,800 for monthly expenses

Want me to log these allocations?

[Yes, allocate ✓]  [I'll do it manually]
```

[Yes, allocate]:
- Creates envelope contributions for each allocation
- Logs a monthly plan record
- Each amount is adjustable inline before confirming

**Investment maturing in 3 days:**

```
Advisor 💬

Your Treasury Bills mature on June 14.
GH¢10,487 will be available.

What would you like to do with it?

[📜 Reinvest in T-bills]
[💰 Move to Emergency Fund]
[🎯 Contribute to a goal]
[🏛️ Pay down the bank loan]
[Let me decide later]
```

Each option opens the relevant flow pre-filled with the exact amount.

**Spending anomaly detected (weekly, not daily):**

```
Advisor 💬

Your transport spending this week is
GH¢180 — about 40% above your usual.
Anything changed?

[It's a one-off]   [Adjust my budget]   [Tell me more]
```

[It's a one-off]: logged, no further alert for 2 weeks.
[Adjust my budget]: opens the transport envelope with the adjust limit flow.
[Tell me more]: advisor shows a breakdown of the transport transactions this week.

---

### 6.4 Weekly Briefing

Every Sunday at 8pm local time, the weekly briefing generates.

It appears as:
- A push notification: "Your week in 30 seconds — tap to see"
- A card on the Home screen the next time they open the app

**The briefing card:**

```
Weekly Briefing  ·  Week of March 10–16

This week went well 🟢

The good news:
✅ Stayed under budget on Food (GH¢180 left)
✅ Emergency fund hit 70% — great progress
✅ Loan payment made on time

Watch this:
⚠️ Car insurance expires in 14 days
⚠️ Freelance invoice overdue — GH¢2,500

Your one action this week:
→ Follow up on the Acme invoice.
   That GH¢2,500 arriving would
   fully fund your emergency fund. 🎯

[Follow up →]   [See full report]   [Dismiss]
```

Rules:
- Always 3 positives first, max 2 watch items
- Always exactly 1 recommended action — not a list
- The recommended action is specific and personalized, not generic advice
- [Follow up →] on the invoice: generates a polite WhatsApp/SMS message draft they can send in one tap

**[See full report]:**

Full screen report slides up showing:
- Complete spending breakdown by category
- Net worth change this week
- Goal progress
- Debt payment record
- Health score change
- AI summary paragraph at the top

---

## Part 7 — Document Vault

### 7.1 Vault Entry

```
Document Vault 🔒

Search: [___________________]

[+ Upload]

FOLDERS
──────────────────────────────────
📂 Insurance              3 docs
📂 Loan Agreements        2 docs
📂 Pay Slips             12 docs
📂 Receipts              47 docs
📂 Tax Documents          3 docs
📂 Property               1 doc
📂 Contracts              2 docs

EXPIRING SOON
──────────────────────────────────
Car Insurance.pdf  ·  14 days  [Update →]
```

"Expiring Soon" section appears at top only when documents are linked to policies with upcoming renewals. Auto-populated from the Protect module.

---

### 7.2 Uploading a Document

**Trigger:** [+ Upload] button or drag-and-drop on web.

**Web drag-and-drop:**

When a file is dragged onto the vault page:
- The entire page dims slightly
- A large drop zone appears with a dashed border: "Drop to upload"
- On drop: file uploads, categorization sheet slides up

**Categorization sheet:**

```
What type of document is this?

[📋 Pay Slip]         [🏛️ Loan Agreement]
[🛡️ Insurance Policy]  [🧾 Receipt]
[🏠 Property Doc]     [📝 Contract]
[📊 Tax Document]     [Other]
```

They select the type → one optional field: "Name this document" (pre-filled from filename, editable) → [Save].

Document appears in the appropriate folder immediately.

**If a pay slip is uploaded:**

The app detects it might be income data and offers: "Want to log this month's income from this payslip? We can extract the amount." → [Yes, log it] → income transaction pre-filled.

**If an insurance document is uploaded:**

"This looks like an insurance document. Link it to a policy in your Protect section?" → [Link to Car Insurance] / [Link to other policy] / [Just save it].

---

### 7.3 Finding Documents

**Search:**

Real-time search across all document names, types, and dates.

Results appear instantly — grouped by folder.

Searching "SSNIT 2024" returns: any document with "SSNIT" or "2024" in the name.

**Browsing folders:**

Tap a folder → list of documents, newest first.

Each document row:
- Document type icon
- File name
- Date added
- File size
- [View] [Share] [Delete]

**Viewing a document:**

Document opens in a full-screen viewer:
- PDF: scrollable, pinch to zoom
- Image: zoomable
- Navigation: ← → for previous/next document in folder
- Bottom bar: [Share] [Download] [Delete]

**Secure sharing:**

[Share securely] → generates a time-limited link (24 hours, 7 days, or 30 days — user selects).

```
Secure link created

This link expires in 24 hours.
Anyone with this link can view
(but not download) the document.

[Copy link]  [Share via WhatsApp]  [Share via email]
```

Used for sending documents to banks, accountants, landlords — without emailing sensitive files.

---

## Part 8 — Notifications System

**The notification philosophy:**

Notifications are a privilege, not a right. The app earns the right to notify by being useful every time it does. Volume discipline is critical — a noisy app gets muted or uninstalled.

**Max notifications per day: 2**

**Notification types and their triggers:**

| Trigger | Notification | Timing |
|---|---|---|
| Bill due | "[Bill] due in [X] days · GH¢[amount]" | 7 days, 3 days, 1 day |
| Insurance expiring | "[Insurance] expires in [X] days" | 30 days, 14 days, 7 days, 1 day |
| Investment maturing | "[Investment] matures in 3 days" | 3 days before only |
| Goal milestone | "You hit [X]% on [goal]! 🎉" | At milestone only |
| Weekly briefing | "Your week in 30 seconds →" | Sunday 8pm |
| Large unusual transaction | "Unusual transaction: GH¢[amount] at [merchant]" | Immediate (if >3× average) |
| Salary detected | "Salary received: GH¢[amount] — want to allocate?" | Immediate on SMS parse |
| Invoice overdue | "[Client] invoice is [X] days overdue" | 7 days after due date |

**What we NEVER notify:**
- Daily "don't forget to log" reminders
- Budget category overspend alerts
- General "check your app" prompts
- Marketing or feature announcements

**First week rule:**

No notifications at all during the user's first 7 days. Let them fall in love with the app before introducing interruptions. After day 7, a single in-app prompt: "Want to get notified about bills, goals, and your weekly briefing?" → [Yes please] [Not right now]. No system permission dialog yet — only after they agree to the concept.

---

## Part 9 — Settings & Customization

### 9.1 Settings Entry

Web: settings icon at bottom of sidebar.
Mobile: profile avatar in top-right → Settings.

Settings sections:
```
Profile
  Name, email, profile picture, currency

Security
  PIN, biometrics, session timeout, change password

Notifications
  Toggle each notification type on/off
  Quiet hours: [10pm – 7am] (default on)

Categories
  Manage all custom categories
  Merge, rename, change icon/color

Accounts & Sync
  Manage connected accounts
  SMS sync settings (Android)
  Supabase sync status

Appearance
  Dark mode: [System / On / Off]
  Language: [English ▼]
  Currency display: [GH¢ / GHS / cedis]

Export & Backup
  Export all data (CSV)
  Export monthly report (PDF)
  Backup to Google Drive

Privacy
  Data handling policy
  Delete specific data
  Delete account

About
  App version, changelog, send feedback
```

---

### 9.2 Security Flow

**PIN setup:**

```
Set up a PIN

[· · · ·]  ← large numpad dots

Choose a 4-digit PIN

(Large numpad below)
```

After entering: "Confirm your PIN" → same PIN again → [Done]. Haptic feedback on each digit press.

PIN saved locally (not uploaded). Can be used as fallback when biometric fails.

**Biometric setup:**

After PIN is set: "Would you also like to use fingerprint / Face ID?" → [Set up] → native biometric enrollment dialog appears.

On future opens: biometric prompt appears. If fails 3 times: falls back to PIN.

**App lock timing:**

Settings: "Lock after [1 minute / 5 minutes / 30 minutes / 1 hour] in background."

Default: 5 minutes.

---

### 9.3 Data Export

**Full data export:**

```
Export your data

Format:
  ○ CSV (all transactions, accounts, goals)
  ○ PDF (formatted monthly reports)
  ○ Both

Date range:
  ○ All time
  ○ This year
  ○ Custom range [____ to ____]

[Generate export]
```

On generate: a download starts (web: file downloads to browser downloads folder, mobile: saved to files app). Toast: "Export ready · [Open file]"

---

## Part 10 — Error States & Edge Cases

### 10.1 No Internet Connection

**Behavior:**
- App works fully offline — all local data is readable and writable
- A small non-intrusive banner appears at the top: "Offline · changes will sync when connected"
- Banner is 24px tall, doesn't shift any content
- When connection restores: "Back online · syncing..." → "All synced ✓" → banner disappears

**Offline-unavailable features:**
- AI Advisor (requires API)
- Currency rate updates
- Cloud backup sync

For the Advisor specifically, if offline: "The advisor needs internet to respond. Everything else works offline."

### 10.2 Sync Conflicts

When the same data is edited on two devices while offline:

Silent resolution using last-write-wins for most data. For financial data (balances), the most recent timestamp wins.

If a conflict can't be resolved automatically: a single notification on next open:

"We found a conflict with your [Account Name] balance. Which is correct?"

[GH¢8,200 from your phone · March 14]  
[GH¢8,450 from your laptop · March 15]  

User picks one. Done. No technical language.

### 10.3 SMS Parse Failures

If Claude API fails to parse an SMS:

The raw SMS text is stored. In the pending approvals section:

```
⚠️  Couldn't auto-parse this SMS

"Your MoMo account was credited with GHS 
500.00 on 15/03/25 at 14:23..."

[Parse manually →]  [Ignore]
```

[Parse manually →] opens quick-add with the raw SMS text displayed above the form for reference. User fills it in manually. This is the fallback — it's rare, but graceful.

### 10.4 Goal Past Deadline

If a goal's deadline passes and it's not complete:

No alarm. No failure state. The goal card simply changes its status text:

"Deadline: March 2025 (passed) · Still going — 65% there 💪"

The goal remains active unless the user archives it. When they open the goal detail: "Your deadline passed, but you're 65% there. Want to set a new target date?" → [Yes, set new date] [Keep going without a deadline] [Archive goal].

### 10.5 Account Balance Goes Negative

If a manual balance update results in a negative number:

No error. Negative balances are real (overdrafts exist). The account card shows:

```
🏦 GCB Account
-GH¢200 (overdraft)
```

The net worth updates to reflect the negative. No special treatment — it's just accurate data.

The Advisor may proactively note: "Your GCB account is overdrawn by GH¢200. Want to move funds from MoMo to cover it?" → [Transfer GH¢200 →].

---

## Part 11 — Delight Details

These are the small moments that make the app feel alive and loved. None of them are necessary. All of them matter.

**The net worth counter on Home:**

Once per day, on first open, the net worth number counts up from a slightly lower value to the real value over 500ms. Every single day. Small, but it makes you feel like your wealth is growing even when it isn't.

**Category icon animations:**

When you select a category in quick-add, the icon bounces once (scale 1.2 → 1.0 over 200ms). Tiny. Satisfying.

**The health score arc draw:**

On first open of each session, the health score arc draws itself clockwise (Deliberate timing, 500ms). Never gets old.

**Progress bars fill on first view:**

Any progress bar — envelope, goal, debt payoff — fills from 0 to its actual value the first time it appears each session. Not every time, just first time. Creates a sense of things loading into place.

**Streak counter:**

A small flame icon appears in the profile area showing consecutive days the app was opened. 🔥1, 🔥7, 🔥30. At streaks of 7, 30, 100, 365: a special card appears celebrating the streak. Nothing beyond a card — no notifications, no pressure.

**Quiet Sunday morning:**

If the user opens the app before 9am on a Sunday: the greeting is specifically "Good morning! Take it easy — your weekly briefing is coming tonight." Acknowledges the day. Small, human.

**End of year:**

On December 31 and January 1, a special summary card appears:

"Your 2025 in numbers:
Total saved: GH¢6,400
Net worth grew: GH¢12,200
Goals completed: 2
Transactions logged: 847
Debt paid down: GH¢4,800

You made real progress this year. 🙌"

No prompts, no upsell. Just acknowledgment.

---

*End of Financial OS Interaction Design Document*
*Version 1.0 — Full specification covering all screens, flows, sub-flows, triggers, and edge cases.*
