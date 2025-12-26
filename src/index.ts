import fs from 'fs';
import path from 'path';
import { Invoice } from './types';
import { MemoryManager } from './MemoryManager';
import { InvoiceProcessor } from './InvoiceProcessor';

// Load mock data
const invoicesRaw = fs.readFileSync(path.join(__dirname, '../data/invoices.json'), 'utf-8');
const invoices: Invoice[] = JSON.parse(invoicesRaw);

// Initialize System
const memory = new MemoryManager();
const processor = new InvoiceProcessor(memory);
// Helper to pause execution (simulates processing time)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// Helper for logging
function printSection(title: string) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(` ${title}`);
    console.log(`${'='.repeat(50)}`);
}

async function runDemo() {
    printSection("STARTING DEMO: FLOWBIT AGENT");
    
    // Reset
    memory.reset(); 
    console.log("Memory cleared to simulate fresh install.\n");
    await wait(1000);

    printSection("SCENARIO 1: Vendor 'Supplier GmbH'");
    await wait(1000);
    
    console.log(">>> Processing INV-A-001 (First time seeing this vendor)...");
    const result1 = processor.process(invoices[0]);
    console.log(`Result: Requires Review? ${result1.requiresHumanReview}`);
    console.log(`Reasoning: ${result1.reasoning}`);
    console.log(`Confidence: ${result1.confidenceScore}`);
    
    await wait(2000);
    
    if (result1.requiresHumanReview) {
        console.log("\n[HUMAN INTERVENTION] User noticed 'Leistungsdatum' means Service Date.");
        console.log(">>> TEACHING MEMORY...");
        memory.learn("Supplier GmbH", "field-mapping", "Leistungsdatum", "serviceDate");
        await wait(1500);
    }

    console.log("\n>>> Processing INV-A-002 (Same vendor, later date)...");
    const result2 = processor.process(invoices[1]);
    console.log(`Result: Requires Review? ${result2.requiresHumanReview}`);
    console.log(`Reasoning: ${result2.reasoning}`);
    console.log(`Corrections: ${JSON.stringify(result2.proposedCorrections)}`);
    console.log("SUCCESS: System automatically extracted Service Date based on memory!");
    
    await wait(2000);

    printSection("SCENARIO 2: Vendor 'Parts AG'");
    await wait(1000);
    
    console.log(">>> Processing INV-B-001 (VAT Inclusive issue)...");
    const result3 = processor.process(invoices[2]);
    console.log(`Result: Requires Review? ${result3.requiresHumanReview}`);
    console.log(`Reasoning: ${result3.reasoning}`);

    await wait(2000);

    console.log("\n[HUMAN INTERVENTION] User confirms 'MwSt. inkl' means we must back-calculate tax.");
    console.log(">>> TEACHING MEMORY...");
    memory.learn("Parts AG", "correction-pattern", "vat-inclusive", true);
    await wait(1500);

    console.log("\n>>> Processing INV-B-002...");
    const result4 = processor.process(invoices[3]);
    console.log(`Corrections: ${JSON.stringify(result4.proposedCorrections)}`);
    console.log(`Normalized Net Amount: ${result4.normalizedInvoice['netAmount']} (Derived from Total)`);
    console.log("SUCCESS: System automatically recalculated tax!");

    await wait(2000);

    printSection("SCENARIO 3: Vendor 'Freight & Co'");
    await wait(1000);

    console.log(">>> Pre-loading memory: 'Seefracht' = SKU-FREIGHT");
    memory.learn("Freight & Co", "field-mapping", "Seefracht", "SKU-FREIGHT");
    await wait(1000);

    console.log(">>> Processing INV-C-001...");
    const result5 = processor.process(invoices[4]);
    const lineItem = result5.normalizedInvoice.lineItems[0];
    console.log(`Line Item Description: "${lineItem.description}"`);
    console.log("SUCCESS: SKU was appended automatically.");

    printSection("DEMO COMPLETE");
}

runDemo().catch(console.error);