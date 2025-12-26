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

    // Save to disk
    private saveMemory() {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memories, null, 2));
    }

    public recall(vendorName: string): MemoryEntry[] {
        this.applyDecay();
        return this.memories.filter(m => m.vendorName === vendorName && m.confidence > 0.2);
    }

    public learn(vendorName: string, type: MemoryType, key: string, value: any, wasSuccessful: boolean = true) {
        const existingIndex = this.memories.findIndex(
            m => m.vendorName === vendorName && m.key === key && m.memoryType === type
        );

        if (existingIndex > -1) {
            const mem = this.memories[existingIndex];
            if (wasSuccessful) {
                mem.confidence = Math.min(mem.confidence + 0.15, 1.0);
                mem.successCount++;
            } else {
                mem.confidence = Math.max(mem.confidence - 0.3, 0.0);
                mem.failureCount++;
            }
            mem.usageCount++;
            mem.lastUsed = new Date().toISOString();
            console.log(`[Memory] Updated pattern for ${vendorName}: ${key} -> ${value} (Confidence: ${mem.confidence.toFixed(2)})`);
        } else {
            const newMemory: MemoryEntry = {
                id: Date.now().toString(),
                vendorName,
                memoryType: type,
                key,
                value,
                confidence: 0.6,
                lastUsed: new Date().toISOString(),
                usageCount: 1,
                successCount: wasSuccessful ? 1 : 0,
                failureCount: wasSuccessful ? 0 : 1
            };
            this.memories.push(newMemory);
            console.log(`[Memory] Created new pattern for ${vendorName}: ${key} -> ${value}`);
        }
        
        this.saveMemory();
    }

    private applyDecay() {
        const DECAY_RATE = 0.01;
        const now = new Date();

        this.memories.forEach(mem => {
            const lastUsed = new Date(mem.lastUsed);
            const daysSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceLastUse > 1) {
                const decayAmount = daysSinceLastUse * DECAY_RATE;
                mem.confidence = Math.max(mem.confidence - decayAmount, 0.1);
            }
        });
    }
    
    public reinforce(ids: string[], wasSuccessful: boolean) {
        this.memories.forEach(mem => {
            if (ids.includes(mem.id)) {
                mem.usageCount++;
                if (wasSuccessful) {
                    mem.confidence = Math.min(mem.confidence + 0.15, 1.0);
                    mem.successCount++;
                } else {
                    mem.confidence = Math.max(mem.confidence - 0.3, 0.0);
                    mem.failureCount++;
                }
                mem.lastUsed = new Date().toISOString();
            }
        });
        this.saveMemory();
    }

    public reset() {
        this.memories = this.memories.filter(m => 
            m.memoryType === 'vendor-preference' || 
            m.memoryType === 'resolution-history'
        );
        this.saveMemory();
    }
}