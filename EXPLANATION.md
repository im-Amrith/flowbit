# Flowbit AI Agent: Project Overview & Architecture

## 1. The Requirement (The "Ask")

### The Problem
Flowbit processes hundreds of invoices daily. While OCR (Optical Character Recognition) extracts text successfully, it lacks context. It is "dumb"—it doesn't understand that "Leistungsdatum" means "Service Date" or that a specific vendor always includes VAT in the price. Currently, human operators fix the same errors repeatedly, and the system never learns from these corrections.

### The Goal
Build a **"Learned Memory" Layer**. Instead of treating every document as a new entry, the system must:
1.  **Check Memory:** "Have I seen this pattern or issue before?"
2.  **Act:** "If yes, fix it automatically based on past confidence."
3.  **Learn:** "If a human corrects me, remember this specific fix for next time."

### Constraints
* **Stack:** TypeScript & Node.js.
* **Persistence:** The system must retain memory across restarts (implemented here using a JSON file).
* **No ML Training:** The solution must use logic and heuristics, not heavy neural network training.

---

## 2. What We Built (The Solution)

We built a **feedback-loop system**. Think of it as a smart filter that sits between the raw extracted data and the final database approval.



### The Architecture
The codebase is divided into three distinct components:

#### A. The Brain (`InvoiceProcessor.ts`)
* **Role:** The Decision Maker.
* **Function:** It takes a raw invoice and queries the `MemoryManager` ("Do we know anything about 'Supplier GmbH'?").
* **Logic:** It calculates a **Confidence Score**.
    * *High Score:* Auto-corrects the data using memory.
    * *Low Score:* Flags the invoice for human review (`requiresHumanReview: true`).

#### B. The Storage (`MemoryManager.ts`)
* **Role:** Long-term Memory.
* **Function:** It saves learned patterns into `data/memory_store.json`.
* **Persistence:** Ensures that when the script stops, the "brain" doesn't get wiped. It reloads existing patterns on the next run.

#### C. The Teacher (`index.ts` / Demo)
* **Role:** Simulation of the Real World.
* **Function:** It orchestrates the lifecycle:
    1.  Runs Invoice #1 $\rightarrow$ **Fails** (Review Required).
    2.  Simulates Human Correction.
    3.  Updates Memory.
    4.  Runs Invoice #2 $\rightarrow$ **Success** (Auto-corrected).

---

## 3. How We Solved the Specific Scenarios

The technical assignment provided specific "Grading Criteria." Here is how our system handles each required scenario:

| Scenario | The Problem | Our Solution |
| :--- | :--- | :--- |
| **Supplier GmbH** | The date is labeled "Leistungsdatum" (German) instead of "Service Date". | **Field Mapping Memory.** We taught the system that for *this specific vendor*, if the text contains "Leistungsdatum", it should extract that value and map it to `serviceDate`. |
| **Parts AG** | The total amount includes VAT ("MwSt. inkl"), but the system expects net prices. | **Correction Pattern Memory.** We taught the system a rule: If `vat-inclusive` is true for this vendor, automatically recalculate the Net Amount (Total / 1.19). |
| **Freight & Co** | Line items like "Seefracht" need a specific SKU code attached. | **Keyword Mapping.** We pre-loaded a memory that states: If the description contains "Seefracht", append `(SKU: SKU-FREIGHT)` to the line item. |
| **General Learning** | The system must demonstrate "Learning over time." | **The Demo Script.** We implemented a live simulation showing Invoice #1 failing, the user teaching the system, and Invoice #2 passing automatically. |

---

## 4. Why This Approach "Wins"
1.  **Auditable:** We generate an `auditTrail` array (as required by the prompt) that logs every internal step ("Recall", "Apply", "Decide"). This ensures the AI is not a "black box."
2.  **Deterministic:** Unlike Large Language Models (LLMs) which can hallucinate, our logic is rule-based. If a specific memory exists, the system *always* applies the correction consistently.
3.  **Heuristic:** We utilized simple math and logic (e.g., deducting 0.2 confidence points if a date is missing) rather than complex models. This fits the "No ML training required" constraint perfectly while remaining lightweight and fast.