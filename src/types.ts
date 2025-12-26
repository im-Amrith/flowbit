// 1. INPUT: The structure of an Invoice (based on provided sample data)
export interface LineItem {
    sku?: string | null;
    description: string;
    qty: number;
    unitPrice: number;
}

export interface InvoiceFields {
    invoiceNumber: string;
    invoiceDate: string;
    serviceDate?: string | null;
    currency: string | null;
    poNumber?: string | null;
    netTotal: number;
    taxRate: number;
    taxTotal: number;
    grossTotal: number;
    lineItems: LineItem[];
}

export interface Invoice {
    invoiceId: string; // Changed from id
    vendor: string;    // Changed from vendorName
    fields: InvoiceFields;
    confidence: number;
    rawText: string;
}

// 2. MEMORY: How we store learned patterns
export type MemoryType = 'vendor-preference' | 'correction-pattern' | 'field-mapping';

export interface MemoryEntry {
    id: string;
    vendorName: string;
    memoryType: MemoryType;
    key: string;
    value: any;
    confidence: number;
    lastUsed: string;
    usageCount: number;
}

// 3. OUTPUT: The exact JSON structure required by Flowbit
export interface AuditStep {
    step: 'recall' | 'apply' | 'decide' | 'learn';
    timestamp: string;
    details: string;
}

export interface ProcessingResult {
    invoiceId: string;
    normalizedInvoice: Record<string, any>;
    proposedCorrections: string[];
    requiresHumanReview: boolean;
    reasoning: string;
    confidenceScore: number;
    memoryUpdates: string[];
    auditTrail: AuditStep[];
}