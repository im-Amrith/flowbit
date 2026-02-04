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

const memory = new MemoryManager();
const processor = new InvoiceProcessor(memory);

const invoicesRaw = fs.readFileSync(path.join(process.cwd(), 'data/invoices.json'), 'utf-8');
const invoices: Invoice[] = JSON.parse(invoicesRaw);

app.get('/api/invoices', (req, res) => {
    res.json(invoices);
});

app.post('/api/process/:id', (req, res) => {
    const invoice = invoices.find(inv => inv.invoiceId === req.params.id);
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const result = processor.process(invoice, invoices);
    res.json(result);
});

app.post('/api/learn', (req, res) => {
    const { vendorName, type, key, value, wasSuccessful } = req.body;
    
    memory.learn(vendorName, type, key, value, wasSuccessful !== false);
    
    res.json({ success: true, message: `Learned: ${key} -> ${value} for ${vendorName}` });
});

app.post('/api/resolve/:id', (req, res) => {
    const { vendorName, status, appliedMemoryIds } = req.body;
    
    const isApproved = status === 'approved';
    
    if (appliedMemoryIds && Array.isArray(appliedMemoryIds)) {
        memory.reinforce(appliedMemoryIds, isApproved);
    }

    const memories = memory.recall(vendorName);
    const history = memories.find(m => m.memoryType === 'resolution-history' && m.key === 'rejection-rate');
    
    let currentRate = history ? history.value : 0;
    let newRate = isApproved ? currentRate * 0.9 : currentRate + (1 - currentRate) * 0.2;
    
    memory.learn(vendorName, 'resolution-history', 'rejection-rate', newRate, isApproved);
    
    res.json({ success: true, message: `Resolution tracked for ${vendorName}. New rejection risk: ${newRate.toFixed(2)}` });
});

app.get('/api/memory', (req, res) => {
    const memPath = path.join(process.cwd(), 'data/memory_store.json');
    if (fs.existsSync(memPath)) {
        const data = fs.readFileSync(memPath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

app.post('/api/reset', (req, res) => {
    memory.reset();
    res.json({ success: true, message: "Memory wiped." });
});

export default app;

if (require.main === module) {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`API Server running at http://localhost:${PORT}`);
    });
}
