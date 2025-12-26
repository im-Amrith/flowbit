# Flowbit AI Agent: Memory-Augmented Invoice Processor

## Project Overview

This project is an intelligent **Invoice Processing Agent** designed to "learn" from human corrections. Unlike static OCR scripts, this agent uses a **Long-Term Memory** layer to recognize vendor-specific patterns (like German date labels, VAT-inclusive pricing, or missing SKUs) and automatically applies these fixes to future invoices.

**Core Loop:** `Recall` → `Apply` → `Decide` → `Learn`

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React (Vite), TailwindCSS
- **Persistence:** File-based JSON storage (`data/memory_store.json`)
- **Logic:** Heuristic-based inference engine with Reinforcement Learning (Confidence scores + Decay + Dynamic Trust)

## Key Features

- **Long-Term Memory**: Remembers vendor-specific field mappings and correction patterns.
- **Dynamic Trust Boost**: Automatically increases confidence for vendors with a long history of successful approvals.
- **Proportional Reinforcement**: Confidence updates are weighted by existing memory strength to prevent over-correction.
- **3-Way Matching**: Validates invoices against Purchase Orders and Delivery Notes.
- **Real-time UI**: Instant visual feedback on confidence scores and reasoning when teaching or resolving invoices.
- **Audit Trail**: Full transparency into every decision the AI makes.

## Setup & Installation

### 1. Prerequisites

- Node.js (v16+)
- npm

### 2. Installation

Clone the repository and install dependencies for both backend and frontend.

```bash
# 1. Install Root/Backend Dependencies
npm install

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

### 3. Running the Application

You need two terminals running simultaneously.

**Terminal 1 (Backend API):**

```bash
npx ts-node src/server.ts
# Runs on http://localhost:3001
```

**Terminal 2 (Frontend UI):**

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## Test Case Guide (Demo Script)

Use this guide to verify the agent's behavior. The system starts with **Zero Knowledge** and learns as you teach it.

### 🔴 Scenario 1: Date Field Mapping (Supplier GmbH)

- **Goal:** Teach the AI that "Leistungsdatum" means "Service Date".
- **Input:** Click `INV-A-001` (Supplier GmbH).
- **Status:** ⚠️ Human Review Required
- **Reasoning:** "Found 'Leistungsdatum' but don't know how to map it yet."
- **Teach:** In the "Teach the AI" form, enter:
  - **Pattern Key:** `Leistungsdatum`
  - **Correct Value:** `serviceDate`
- **Action:** Click **Save Rule & Retry**.
- **Result:** ✅ Auto-Accepted (Correction: "Extracted Service Date...")
- **Verify:** Click `INV-A-002` (Same Vendor).
  - **Status:** ✅ Auto-Accepted (Immediate)
  - **Reasoning:** "Applied 1 learned patterns."

### 🔴 Scenario 2: VAT Recalculation (Parts AG)

- **Goal:** Teach the AI to fix "VAT Inclusive" totals.
- **Input:** Click `INV-B-001` (Parts AG).
- **Status:** ⚠️ Human Review Required
- **Reasoning:** "Detected VAT-inclusive language but math indicates Gross was treated as Net."
- **Teach:** In the "Teach the AI" form, enter:
  - **Pattern Key:** `vat-inclusive`
  - **Correct Value:** `true`
- **Action:** Click **Save Rule & Retry**.
- **Result:** ✅ Auto-Accepted (Correction: "Recalculated Net: 2000 / Tax: 400")

### 🟢 Scenario 3: Auto-Heuristic PO Match (Supplier GmbH)

- **Goal:** Verify the AI infers PO numbers from context.
- **Input:** Click `INV-A-003` (Supplier GmbH).
- **Status:** ✅ Auto-Accepted
- **Correction:** "Auto-matched PO-A-051 based on item 'Widget Pro'"
- **Note:** This logic is pre-programmed as a heuristic.

### 🟢 Scenario 4: Missing Currency Recovery (Parts AG)

- **Goal:** Verify the AI recovers missing currency symbols.
- **Input:** Click `INV-B-003` (Parts AG).
- **Status:** ✅ Auto-Accepted
- **Correction:** "Recovered currency 'EUR' from raw text."

### 🟠 Scenario 5: SKU Assignment (Freight & Co)

- **Goal:** Teach the AI to map generic descriptions to specific SKUs.
- **Input:** Click `INV-C-002` (Freight & Co).
- **Status:** ⚠️ Human Review Required
- **Reasoning:** "Detected 'Seefracht' service but no SKU is assigned."
- **Teach:** In the "Teach the AI" form, enter:
  - **Pattern Key:** `Seefracht`
  - **Correct Value:** `SKU-FREIGHT`
- **Action:** Click **Save Rule & Retry**.
- **Result:** ✅ Auto-Accepted (Correction: "Assigned SKU-FREIGHT to line items.")

### 🛑 Scenario 6: Duplicate Detection (Safety Layer)

- **Goal:** Ensure the AI blocks duplicate submissions.
- **Input:** Click `INV-B-004` (Parts AG).
- **Status:** ⚠️ Human Review Required
- **Confidence Score:** 0%
- **Reasoning:** "Possible Duplicate Submission Detected."
- **Action:** **Do NOT teach.** This is a safety stop.

### 📈 Scenario 7: The Trust Loop (Freight & Co)

- **Goal:** Observe the AI "trusting" a vendor over time.
- **Input:** Click `INV-C-004` (Freight & Co).
- **Status:** ⚠️ Human Review Required (Confidence ~68%)
- **Action:** Click **Approve**.
- **Repeat:** Click `INV-C-004` again and click **Approve** 2 more times.
- **Result:** ✅ Auto-Accepted (Confidence ~83%)
- **Reasoning:** "Applied Vendor Trust Boost based on clean history."

---

## Architecture: The Memory Layer

The agent implements a **Reinforcement Learning** loop:

1.  **Recall:** Scans `memory_store.json` for vendor-specific rules.
2.  **Apply:** Executes corrections (Field Mapping, VAT Math, SKU Assignment).
3.  **Decide:** Calculates a **Confidence Score**.
    - **Base Score:** Starts at 0.75 (Neutral).
    - **Trust Boost:** Vendors with >2 successful approvals and <10% rejection rate get a scaling boost (up to +0.25).
    - **Threshold:** If Confidence > 80% AND no critical errors → **Auto-Accept**.
4.  **Learn & Reinforce:**
    - **Success:** Approving an invoice reinforces applied memories (+0.15 * current confidence).
    - **Failure:** Rejecting an invoice penalizes applied memories (-0.30).
    - **Decay:** Unused memories lose 1% confidence per day to prevent "stale" logic.

## Output Contract (JSON)

The agent returns a structured `ProcessingResult`:

```json
{
  "invoiceId": "INV-A-001",
  "status": "auto-accepted",
  "confidence": 0.95,
  "corrections": ["Extracted Service Date from 'Leistungsdatum'"],
  "auditTrail": [
    { "step": "Recall", "detail": "Found 2 learned patterns for Supplier GmbH" },
    { "step": "Apply", "detail": "Mapped 'Leistungsdatum' to serviceDate" },
    { "step": "Decide", "detail": "Confidence 95% exceeds threshold 80%" }
  ],
  "data": { ... }
}
```

## Project Structure

```
├── data/
│   ├── invoices.json           # Mock invoice data
│   ├── memory_store.json       # Persistent AI memory
│   ├── purchase_order.json     # Reference POs
│   └── delivery_notes.json     # Reference DNs
├── src/
│   ├── server.ts               # Express API
│   ├── InvoiceProcessor.ts     # Core AI Logic (Recall/Apply/Decide)
│   ├── MemoryManager.ts        # Memory Lifecycle (Learn/Reinforce/Decay)
│   ├── types.ts                # Shared Interfaces
│   └── index.ts                # CLI Demo Script
└── frontend/
    └── src/App.tsx             # React Dashboard
```

```

```
