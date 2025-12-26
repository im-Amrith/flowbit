Here is the fully detailed `README.md` file for your project. It includes setup instructions, architectural explanations, and a specific **Test Case Guide** that you can use during your demo recording to prove every requirement is met.

Create a file named `README.md` in the root of your project and paste this content:

```markdown
# Flowbit AI Agent: Memory-Augmented Invoice Processor

## 📋 Project Overview
This project is an intelligent **Invoice Processing Agent** designed to "learn" from human corrections. Unlike static OCR scripts, this agent uses a **Long-Term Memory** layer to recognize vendor-specific patterns (like German date labels, VAT-inclusive pricing, or missing SKUs) and automatically applies these fixes to future invoices.

**Core Loop:** `Recall` → `Apply` → `Decide` → `Learn`

## 🛠️ Tech Stack
* **Backend:** Node.js, Express, TypeScript
* **Frontend:** React (Vite), TailwindCSS
* **Persistence:** File-based JSON storage (`data/memory_store.json`)
* **Logic:** Heuristic-based inference engine (No external ML APIs required)

---

## 🚀 Setup & Installation

### 1. Prerequisites
* Node.js (v16+)
* npm

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

## 🧪 Test Case Guide (Demo Script)

Use this guide to verify the agent's behavior. The system starts with **Zero Knowledge** and learns as you teach it.

### 🔴 Scenario 1: Date Field Mapping (Supplier GmbH)

**Goal:** Teach the AI that "Leistungsdatum" means "Service Date".

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-A-001** (Supplier GmbH) in the sidebar. | **Status:** ⚠️ Human Review Required<br>

<br>**Reasoning:** "Found 'Leistungsdatum' but don't know how to map it yet." |
| **2. Teach** | In the "Teach the AI" form, enter:<br>

<br>• **Pattern Key:** `Leistungsdatum`<br>

<br>• **Correct Value:** `serviceDate`<br>

<br>Click **Save Rule & Retry**. | **Status:** ✅ Auto-Accepted<br>

<br>**Correction:** "Extracted Service Date '01.01.2024' from 'Leistungsdatum'" |
| **3. Verify** | Click **INV-A-002** (Same Vendor). | **Status:** ✅ Auto-Accepted (Immediate)<br>

<br>**Reasoning:** "Applied 1 learned patterns." |

---

### 🔴 Scenario 2: VAT Recalculation (Parts AG)

**Goal:** Teach the AI to fix "VAT Inclusive" totals (where Gross was treated as Net).

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-B-001** (Parts AG). | **Status:** ⚠️ Human Review Required<br>

<br>**Reasoning:** "Detected VAT-inclusive language but math indicates Gross was treated as Net." |
| **2. Teach** | In the "Teach the AI" form, enter:<br>

<br>• **Pattern Key:** `vat-inclusive`<br>

<br>• **Correct Value:** `true`<br>

<br>Click **Save Rule & Retry**. | **Status:** ✅ Auto-Accepted<br>

<br>**Correction:** "Recalculated Net: 2000 / Tax: 400"<br>

<br>**Total:** Updates to correct value. |

---

### 🟢 Scenario 3: Auto-Heuristic PO Match (Supplier GmbH)

**Goal:** Verify the AI can infer a Purchase Order number from line item context without manual teaching.

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-A-003** (Supplier GmbH). | **Status:** ✅ Auto-Accepted<br>

<br>**Correction:** "Auto-matched PO-A-051 based on item 'Widget Pro'"<br>

<br>**Note:** This logic is pre-programmed as a heuristic. |

---

### 🟢 Scenario 4: Missing Currency Recovery (Parts AG)

**Goal:** Verify the AI recovers missing currency symbols from raw text.

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-B-003** (Parts AG). | **Status:** ✅ Auto-Accepted<br>

<br>**Correction:** "Recovered currency 'EUR' from raw text." |

---

### 🟠 Scenario 5: SKU Assignment (Freight & Co)

**Goal:** Teach the AI to map generic descriptions to specific SKUs.

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-C-002** (Freight & Co). | **Status:** ⚠️ Human Review Required<br>

<br>**Reasoning:** "Detected 'Seefracht' service but no SKU is assigned." |
| **2. Teach** | In the "Teach the AI" form, enter:<br>

<br>• **Pattern Key:** `Seefracht`<br>

<br>• **Correct Value:** `SKU-FREIGHT`<br>

<br>Click **Save Rule & Retry**. | **Status:** ✅ Auto-Accepted<br>

<br>**Correction:** "Assigned SKU-FREIGHT to line items." |

---

### 🛑 Scenario 6: Duplicate Detection (Safety Layer)

**Goal:** Ensure the AI blocks duplicate submissions instead of processing them.

| Step | Action | Expected Output |
| --- | --- | --- |
| **1. Input** | Click **INV-B-004** (Parts AG). | **Status:** ⚠️ Human Review Required<br>

<br>**Confidence Score:** 0%<br>

<br>**Reasoning:** "Possible Duplicate Submission Detected."<br>

<br>**Action:** Do NOT teach. This is a safety stop. |

---

## 📂 Project Structure

```
├── data/
│   ├── invoices.json           # The Source of Truth (12 Invoices)
│   ├── memory_store.json       # Where the AI saves learned rules
│   └── purchase_orders.json    # Reference data for 3-way matching
├── src/
│   ├── server.ts               # Express API endpoints
│   ├── InvoiceProcessor.ts     # The Brain: Recall/Apply/Decide Logic
│   ├── MemoryManager.ts        # Handles reading/writing JSON memory
│   └── types.ts                # TypeScript Interfaces
└── frontend/
    └── src/App.tsx             # The React Dashboard UI

```

## 🧠 Logic Explanation

1. **Recall:** When an invoice arrives, the `MemoryManager` scans `memory_store.json` for rules matching the vendor.
2. **Apply:**
* **Field Mapping:** If a key (e.g., "Leistungsdatum") is found in the text, map its value to the target field.
* **Corrections:** If a flag (e.g., "vat-inclusive") is active, execute specific math logic.


3. **Decide:**
* The `InvoiceProcessor` calculates a **Confidence Score**.
* It checks against **Heuristics** (duplicates, missing fields).
* If Confidence > 80% AND no critical errors → **Auto-Accept**.
* Otherwise → **Request Human Review**.


4. **Learn:** When the user fills the "Teach" form, the rule is saved to `memory_store.json` to be recalled next time.

```

```