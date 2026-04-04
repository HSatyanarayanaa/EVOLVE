const PROBLEM_STATEMENTS = [
  {
    id: 'PS1',
    track: 1,
    title: 'CivicShield — Tamper-Proof Welfare Disbursement Validation System',
    sdg: 'SDG 16 — Peace, Justice & Strong Institutions | SDG 1 — No Poverty',
    summary: `Build a Sequential Validation Engine — a cryptographically enforced pipeline that wraps every welfare transaction in a verification envelope before a single rupee moves.`,
    problemStatement: `You will build a Sequential Validation Engine — a cryptographically enforced pipeline that wraps every welfare transaction in a verification envelope before a single rupee moves. Every gate must be passed in order. Every failure must be logged. Every approval must be permanently recorded in a tamper-evident ledger. If the system detects fraud or tampering at any point, it freezes itself — automatically, immediately, and completely.

This is not a CRUD application with a fraud label on it. The integrity mechanisms must be real, verifiable, and demonstrably unbypassable.

Dataset : <a href="https://docs.google.com/spreadsheets/d/1JiplJvyJ5sjpTjqFJCgL43DzZCryiIYR/edit?gid=208810484#gid=208810484" target="_blank" style="color:#a855f7; text-decoration:underline;">CivicShield_Dataset.xlsx</a>`,
    background: `India's public welfare disbursement systems lose thousands of crores annually — not because funds are unavailable, but because the distribution pipeline has no integrity layer. The same identity claims benefits across multiple regions simultaneously. Cooling windows are gamed by automated scripts. Disbursement ledgers are quietly altered by insiders after the fact. Beneficiaries who died years ago continue receiving monthly payments as ghost entries in poorly maintained registries.

CivicShield is your mandate to fix this.`,
    features: [
      { name: 'Component 1 — Identity Hash Validator', desc: `Every Citizen_ID entering the system must be converted to a SHA-256 hash before any processing begins. The raw Citizen_ID must never be stored or logged anywhere in the pipeline after this point — only the hash travels through all downstream gates and ledger entries.

Your implementation must handle all of the following:
• Compute CitizenHash = SHA256(Citizen_ID + Salt) where Salt is a system-defined constant declared in your configuration. Store and use only the hash from this point forward.
• Before any transaction proceeds, check whether the incoming hash already exists in the active processing queue. If it does, reject immediately as a duplicate concurrent claim and log it with flag DUPLICATE_REJECTED.
• Implement replay attack detection — if the same CitizenHash submits an identical claim (same Scheme_Eligibility, same Scheme_Amount) within a 10-minute window of any previous attempt whether approved or rejected, reject it with flag REPLAY_DETECTED.` },
      { name: 'Component 2 — Three-Gate Sequential Verification Protocol', desc: `Every transaction must pass all three gates in strict order. The engine enforces this sequence — the UI cannot override it, skip a gate, or allow partial processing.

Gate 1 — Eligibility Verification: Look up the incoming CitizenHash against the loaded registry. A transaction passes Gate 1 only if all six conditions are true simultaneously: Citizen_ID maps to an existing record, Account_Status is exactly Active, Aadhaar_Linked is TRUE, Requested scheme matches exactly, Requested amount matches exactly, Claim_Count is <= 3.

Gate 2 — Budget Integrity Check: The system initializes with a fixed disbursement budget of ₹10,00,000. Budget is decremented only after full three-gate approval. If approving would reduce budget below ₹0, reject. When reaching ₹0, system auto-locks entirely.

Gate 3 — Frequency Abuse Detection: No citizen may receive an approved disbursement within 30 days of their Last_Claim_Date. On approval, update Last_Claim_Date.` },
      { name: 'Component 3 — Immutable Hash-Linked Ledger', desc: `Every transaction that completes full three-gate approval must be appended to a hash-linked ledger file where each record contains the hash of the record before it — making silent modification detectable.

Each ledger record must contain exactly these fields: TransactionID, Timestamp, CitizenHash, Scheme, Amount, Region_Code, Income_Tier, GatesPassed, PreviousHash, CurrentHash = SHA256(Timestamp + CitizenHash + Scheme + Amount + PreviousHash).

Integrity rules: After every append, run a full chain integrity check. If mismatch is found, system must freeze immediately. Ledger must be stored as JSON/CSV.` },
      { name: 'Component 4 — Automatic System Lock', desc: `The system must freeze itself without any human action under these three conditions:
1) Ledger hash chain mismatch detected during integrity check.
2) Budget reaches ₹0 after a final approved transaction.
3) Admin triggers Emergency Pause from the admin panel.

When frozen the system must: Block all incoming transaction requests immediately; Display freeze reason clearly; Log the freeze event; Require explicit admin unfreeze for ADMIN_PAUSED.` },
      { name: 'Component 5 — Kill-Switch Admin Panel', desc: `A real-time dashboard giving administrators full visibility and control — auto-refreshing every 5 seconds without page reload.

Must display live: System Status badge (ACTIVE, PAUSED, FROZEN, BUDGET_EXHAUSTED), Budget Remaining in ₹, Total transactions processed, Approval rate percentage, Last 10 transactions.

Must support: Emergency Pause, Resume (only if PAUSED), Tamper Report Download (JSON report when FROZEN), Registry Viewer.` }
    ],
    constraints: `• The system must be a web application with a backend — no frontend-only submissions.
• CivicShield_Dataset.xlsx must be loaded on startup — hardcoding citizen data instead of reading from the file disqualifies the submission.
• All SHA-256 operations must be implemented in your backend code — third-party fraud detection services are not permitted.
• The ledger must be stored as a human-readable JSON or CSV file so evaluators can tamper with it during TC-10.
• Raw Citizen_ID values must never appear in logs, ledger entries, or the admin panel — only CitizenHash.`,
    bonus: `• Role-Based Access: Two admin roles — Viewer (read-only dashboard) and Operator (can pause, resume, download tamper report). Unauthenticated access to any admin endpoint returns 401.
• Fraud Pattern Report: After every 10 transactions, auto-generate a summary showing the most common rejection reason, citizens with highest Claim_Count, and budget burn rate by Region_Code.
• Webhook Alert: When the system freezes for any reason, fire a webhook to a configurable URL with freeze reason, timestamp, last valid ledger hash, and Budget_Remaining.`
  },
  {
    id: 'PS2',
    track: 2,
    title: "SheSafe — Women's Safety Companion",
    sdg: 'SDG 5 — Gender Equality | SDG 11 — Sustainable Cities & Communities',
    summary: `Build a comprehensive women's safety mobile or web application with six core features working together as a unified experience.`,
    problemStatement: `Build a fully functional women's safety mobile or web application with six core features working together as a unified experience. The app must be intuitive enough to use under stress, reliable enough to work in low-connectivity conditions, and discreet enough to not draw attention when discretion matters most.

Domain: Mobile Applications & Public Safety`,
    background: `In a moment of danger, unlocking a phone and navigating to an SOS button can be impossible. Yet most safety apps today are built around exactly that assumption — that a woman in danger has the time, calm, and freedom to interact with her phone.

SheSafe is built around the opposite assumption.

You will build a women's safety companion that works powerfully as a standalone app — and gets smarter when paired with a simple wearable. A woman walking home late shouldn't have to think about triggering help. The app should do the heavy lifting, and optionally, her body should do the rest.`,
    features: [
      { name: 'Feature 1 — SOS System', desc: `A one-tap SOS that a user can trigger instantly without unlocking the app or navigating any menus.
• Single large SOS button to send live GPS directly to emergency contacts via SMS.
• 5-second cancellation window.
• Discreet Mode: Disguise app as neutral screen (calculator/notes). Real app accessible via hidden gesture.
• Continuous location updates every 60 seconds until marked safe.
• Every trigger must be logged.` },
      { name: 'Feature 2 — Live Trip Sharing', desc: `A real-time journey monitoring system that keeps trusted contacts informed.
• User enters destination and starts a trip. App shares live GPS location link.
• Set expected arrival time. If not Marked Safe within 10 minutes of arrival, auto-alert contacts.
• The link must be openable on any browser without app installation.
• Trip history must be saved.` },
      { name: 'Feature 3 — Ride Verification', desc: `A quick vehicle logging system that creates a digital record of every ride taken.
• User enters vehicle reg number, vehicle type, and optional driver name.
• Instantly shared with emergency contacts via SMS with timestamp and current GPS.
• Ride Log saved locally. Manual "Share Ride" available during trip.` },
      { name: 'Feature 4 — Buddy System', desc: `A route-matching system that connects women traveling similar routes at similar times.
• Enter origin, destination, and approximate departure time.
• Match with registered users traveling the same route within a 30-minute window.
• In-app chat coordination once accepted.
• In-app alerts if bunny doesn't confirm safe arrival within 15 mins of ETA.` },
      { name: 'Feature 5 — Community Alert Board', desc: `A crowdsourced live map of reported incidents and unsafe zones.
• Report incidents with pins, incident type, and description.
• Color-coded pins visible on a live map.
• Reports auto-expire after 48 hours unless upvoted to confirm activity.
• Shows user current location next to pins.` },
      { name: 'Feature 6 — Safe Route Suggester', desc: `A routing system factoring in community-reported danger zones.
• Returns two options: fastest route and safest route.
• Safest route avoids active pins within a 200m radius.
• Displays a Safety Score (0 to 100) computed from alert pins.
• Routes auto-update if new community alerts are submitted.` }
    ],
    hardware: {
      components: `Arduino + Pulse Sensor + Vibration Sensor + Bluetooth Module (Optional)`,
      description: `The wearable monitors heart rate and sudden physical vibration simultaneously. If heart rate exceeds 120 BPM and vibration is detected within the same 10-second window, the wearable sends a Bluetooth signal to the app which auto-triggers SOS — no phone interaction required.

Integration requirements:
• Pair Wearable screen in app.
• Persistent indicator of wearable connection.
• Wearable SOS behaves identically to manual SOS.
• Displays warning if disconnected.`
    },
    constraints: `• The system must be a web application or a mobile app
• SMS sending must use a real SMS gateway (Twilio, Fast2SMS, or equivalent) — simulated or console-logged SMS alerts do not qualify
• GPS location must use the device's real location API — hardcoded or mocked coordinates do not qualify
• The tracking link shared with contacts must be openable on any browser without login`,
    bonus: `• Fake Call Feature: User can schedule a fake incoming call to their phone (with a configurable caller name) as a discreet exit strategy.
• Periodic Safe Check-in: App sends silent push notification every 30 mins during active trip to confirm safety.
• Offline SOS: If no internet connectivity, SOS falls back to direct SMS (without a tracking link) so the feature never fails completely.`
  },
  {
    id: 'PS3',
    track: 3,
    title: 'Orchestrix — Multi-Agent Research Intelligence Platform',
    sdg: 'SDG 4 — Quality Education | SDG 9 — Industry, Innovation & Infrastructure',
    summary: `Build a multi-agent AI platform where specialized agents collaborate autonomously to handle the full research pipeline.`,
    problemStatement: `Design and develop a fully functional Research Intelligence Platform built on a multi-agent architecture. Each agent has a defined role and responsibility. The Orchestrator must coordinate them intelligently based on the user's query — deciding which agents to invoke, in what order, and how to merge their outputs into a coherent result.

This is not a wrapper around a single LLM call. Agents must operate with clear separation of concern, and the orchestration logic must be demonstrably non-trivial.

Domain: Artificial Intelligence & Productivity`,
    background: `The modern research workflow is deeply fragmented. A researcher today juggles multiple tools — search engines, citation managers, spreadsheets, and note-taking apps — just to get from a research question to a structured insight. This overhead is particularly painful for students and early-stage researchers who lack institutional access to premium tools.

Orchestrix challenges you to eliminate that fragmentation entirely. You will build a multi-agent AI platform where specialized agents collaborate autonomously to handle the full research pipeline — from discovery to analysis to citation — all orchestrated by a central coordination layer.`,
    features: [
      { name: 'Agent 1 — Research Discovery Agent', desc: `Query real academic data sources (e.g., Semantic Scholar API, arXiv API, CrossRef, OpenAlex — no mocked datasets).
• Return title, authors, year, abstract, source URL, citation count.
• Results must be relevance-ranked using a scoring mechanism.
• Must handle pagination to fetch beyond the first page.` },
      { name: 'Agent 2 — Analysis Agent', desc: `Receives output from Discovery Agent and performs at least three analyses:
• Publication volume trend
• Top contributing authors/institutions
• Keyword/topic frequency
• Citation impact distribution
• Identification of emerging sub-topics
All analyses must be rendered as interactive visualizations in the UI.` },
      { name: 'Agent 3 — Citation Generator Agent', desc: `Accept any paper and generate formatted citations in at least two styles (APA, MLA, IEEE, Chicago).
• Must support bulk citation export (download as .txt or .bib file).
• Citation accuracy will be spot-checked.` },
      { name: 'Agent 4 — Summarization & Synthesis Agent', desc: `Generate a structured summary for any individual paper.
• Generate cross-paper synthesis when multiple papers are selected (identifying common themes, contradictions, or gaps).` },
      { name: 'Orchestrator System', desc: `A central layer coordinating agents based on execution plan.
• Support sequential and conditional execution.
• Orchestration logic must be visible to user (trace log, execution timeline).
• Agents must be modular.` },
      { name: 'Persistent Knowledge Dashboard', desc: `Store past queries, fetched papers, analyses, and summaries.
• Users can name a session, revisit, add notes, and compare two sessions side by side.
• Data must persist across reloads and sessions.` }
    ],
    constraints: `• The platform must be a web application (mobile is acceptable as an addition, not a substitute).
• No fully pre-built research platforms (e.g., ResearchRabbit, Elicit clones) may be used as your backend. You are building the intelligence layer.
• All external API keys must be submitted alongside the project or configurable via a .env file — hardcoded credentials will disqualify the submission.
• The application must be deployable and runnable by evaluators within 10 minutes using documented setup steps. Projects that fail to run will not be evaluated.`,
    bonus: `• Agent Conflict Resolution: Implement a resolution mechanism that surfaces conflicts to the user if Summarization and Analysis agents disagree.
• Scheduled Research Digest: Allow recurring queries that run automatically and notify users of new papers.`
  }
];

module.exports = PROBLEM_STATEMENTS;
