<p align="center">
	<h1 align="center"><b>Nuts</b></h1>
<p align="center">
    Your personal finance OS
    <br />
    <br />
    <a href="https://nutsapp.ridyrich.engineer">Demo</a>
    ·
    <a href="https://nuts.ridyrich.engineer">Website</a>
    ·
    <a href="https://github.com/fantasy-programming/nuts/issues">Issues</a>
  </p>
</p>

## About Nuts

Nuts is a comprehensive personal finance management platform designed to be your complete financial operating system.

## ✨ Features

- Multi-Platform Support (Web, mobile)
- Fully offline-first + Sync - Once loaded you can use the app without internet and your changes are synched to other devices once back online

- Easy transaction entry
  - SMS autoparser (reads MoMo, bank SMS alerts and logs transactions automatically in the background)
  - Voice input
  - text input (natural language into structured transactions)
  - Receipt OCR
  - Quick-add widget — home screen shortcut, 2 taps to log anything
  - Smart recurring rules — learns patterns ("Shell every Friday = fuel")
  - One-tap confirmation — parsed transactions appear as a card you just approve or dismiss, never retype

- Flexible budgeting
  - Flexible envelopes — assign every cedi a job, but with easy rollovers
  - Income-pattern detection — adapts to weekly, irregular, or freelance income, no forced monthly resets
  - "Adjust budget" without guilt — one tap to move money between envelopes
  - Bill reminders — electricity, data bundles, school fees, subscriptions

- Forecasting & Insights
  - End-of-month projection — "at this rate you'll be short GH¢800"
  - What-if simulator — "if I cut takeaways 3x/week, I save X by December"
  - Weekly spending pattern report — highlights, not a wall of numbers
  - Anomaly alerts — "you spent 40% more than usual on transport this week"
  - Net worth tracker — assets vs liabilities over time

- Gamification & Streaks
  - Streak counter — days/weeks reviewed without breaking
  - Savings wins — celebrate hitting a milestone ("you saved GH¢500 this month! 🎉")
  - Weekly 2-minute review — a summary card every Sunday, not daily nagging
  - Goals with progress bars — holiday, phone, emergency fund, etc.
  - Gentle nudges not guilt — "you're close on food, still fine though"

- Privacy & Security
  - No selling of data, ever
  - Optional cloud sync with end-to-end encryption
  - PIN / biometric lock
  - Export to CSV / PDF (for taxes or your own records)

- UI Principles
  - Clean, beautiful, minimal — one key number front and center
  - Dark mode
  - Positive framing everywhere — remaining budget, not overspent amount
  - No clutter, no upsell popups

## Get Started

### Quick Start with Docker

The fastest way to get Nuts running locally:

```bash
# Clone the repository
git clone https://github.com/Fantasy-Programming/nuts.git
cd nuts

# Start all services
docker-compose up -d
```


## 📄 License

This project is licensed under the **[AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)** for non-commercial use.
By using this software, you agree to the terms of the license.

---

<p align="center">
  <strong>Built with ❤️ by the Nuts team</strong>
</p>
