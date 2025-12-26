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
    invoiceId: string;
    vendor: string;
    fields: InvoiceFields;
    confidence: number;
    rawText: string;
}

export type MemoryType = 'vendor-preference' | 'correction-pattern' | 'field-mapping' | 'resolution-history';

export interface MemoryEntry {
    id: string;
    vendorName: string;
    memoryType: MemoryType;
    key: string;
    value: any;
    confidence: number;
    lastUsed: string;
    usageCount: number;
    successCount: number;
    failureCount: number;
}

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
    isDuplicate?: boolean;
    reasoning: string;
    confidenceScore: number;
    memoryUpdates: string[];
    appliedMemoryIds: string[];
    auditTrail: AuditStep[];
}

export interface PurchaseOrder {
    poNumber: string;
    vendor: string;
    date: string;
    lineItems: { sku: string; qty: number; unitPrice: number }[];
}

export interface DeliveryNote {
    dnNumber: string;
    vendor: string;
    poNumber: string;
    date: string;
    lineItems: { sku: string; qtyDelivered: number }[];
}