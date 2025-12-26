import fs from 'fs';
import path from 'path';
import { MemoryEntry, MemoryType } from './types';

const MEMORY_FILE = path.join(__dirname, '../data/memory_store.json');

export class MemoryManager {
    private memories: MemoryEntry[] = [];

    constructor() {
        this.loadMemory();
    }

    // Load from disk
    private loadMemory() {
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
            this.memories = JSON.parse(data);
        } else {
            this.memories = [];
        }
    }

    // Save to disk (Persistence Requirement)
    private saveMemory() {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memories, null, 2));
    }

    // 1. RECALL: Find relevant memories for a vendor
    public recall(vendorName: string): MemoryEntry[] {
        return this.memories.filter(m => m.vendorName === vendorName);
    }

    // 2. LEARN: Add or Update a memory
    public learn(vendorName: string, type: MemoryType, key: string, value: any) {
        const existingIndex = this.memories.findIndex(
            m => m.vendorName === vendorName && m.key === key && m.memoryType === type
        );

        if (existingIndex > -1) {
            // Reinforcement: Increase confidence if it already exists
            const mem = this.memories[existingIndex];
            mem.confidence = Math.min(mem.confidence + 0.1, 1.0); // Cap at 1.0
            mem.usageCount++;
            mem.lastUsed = new Date().toISOString();
            console.log(`[Memory] Strengthened pattern for ${vendorName}: ${key} -> ${value}`);
        } else {
            // New Learning
            const newMemory: MemoryEntry = {
                id: Date.now().toString(),
                vendorName,
                memoryType: type,
                key,
                value,
                confidence: 0.5, // Start with medium confidence
                lastUsed: new Date().toISOString(),
                usageCount: 1
            };
            this.memories.push(newMemory);
            console.log(`[Memory] Created new pattern for ${vendorName}: ${key} -> ${value}`);
        }
        
        this.saveMemory();
    }
    
    // Helper to clear memory for demo purposes
    public reset() {
        this.memories = [];
        this.saveMemory();
    }
}