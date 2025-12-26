import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { InvoiceProcessor } from './InvoiceProcessor';
import { MemoryManager } from './MemoryManager';
import { Invoice } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI Components
const memory = new MemoryManager();
const processor = new InvoiceProcessor(memory);

// Load Invoices
const invoicesRaw = fs.readFileSync(path.join(__dirname, '../data/invoices.json'), 'utf-8');
const invoices: Invoice[] = JSON.parse(invoicesRaw);

// --- API ENDPOINTS ---

// 1. Get all invoices (for the sidebar)
app.get('/api/invoices', (req, res) => {
    res.json(invoices);
});

// 2. Process a specific invoice
app.post('/api/process/:id', (req, res) => {
    // FIX: Use .invoiceId instead of .id
    const invoice = invoices.find(inv => inv.invoiceId === req.params.id);
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const result = processor.process(invoice);
    res.json(result);
});

// 3. Teach the AI (Human Correction)
app.post('/api/learn', (req, res) => {
    const { vendorName, type, key, value } = req.body;
    
    // Call the learning logic
    memory.learn(vendorName, type, key, value);
    
    res.json({ success: true, message: `Learned: ${key} -> ${value} for ${vendorName}` });
});

// 4. View Memory (Visualization Bonus)
app.get('/api/memory', (req, res) => {
    const memPath = path.join(__dirname, '../data/memory_store.json');
    if (fs.existsSync(memPath)) {
        const data = fs.readFileSync(memPath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

// 5. Reset Memory
app.post('/api/reset', (req, res) => {
    memory.reset();
    res.json({ success: true, message: "Memory wiped." });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
});