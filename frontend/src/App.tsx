import { useState, useEffect } from 'react';
import axios from 'axios';

// --- Updated Types to match new JSON ---
interface LineItem {
  sku?: string;
  description: string;
  qty: number;
  unitPrice: number;
}

interface InvoiceFields {
  netTotal: number;
  grossTotal: number;
  lineItems: LineItem[];
}

interface Invoice {
  invoiceId: string; // New ID field
  vendor: string;    // New Vendor field
  fields: InvoiceFields;
  rawText: string;
}

interface ProcessResult {
  requiresHumanReview: boolean;
  confidenceScore: number;
  reasoning: string;
  proposedCorrections: string[];
}

// ... Icons (Keep existing icons) ...
const FileTextIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" x2="8" y1="13" y2="13"/>
      <line x1="16" x2="8" y1="17" y2="17"/>
      <line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  );
  
  const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
  
  const AlertIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  
  const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);

  // Teach Form State
  const [correctionKey, setCorrectionKey] = useState('');
  const [correctionValue, setCorrectionValue] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchMemories();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/invoices');
      setInvoices(res.data);
    } catch (e) {
      console.error("Error connecting to backend");
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/memory');
      setMemories(res.data);
    } catch (e) { console.error(e); }
  };

  const processInvoice = async (inv: Invoice) => {
    setLoading(true);
    setSelectedInvoice(inv);
    setResult(null); 
    setCorrectionKey('');
    setCorrectionValue('');
    
    setTimeout(async () => {
      try {
        // Use invoiceId here!
        const res = await axios.post(`http://localhost:3001/api/process/${inv.invoiceId}`);
        setResult(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 800);
  };

  const handleTeach = async () => {
    if (!selectedInvoice) return;
    const type = correctionKey === 'vat-inclusive' ? 'correction-pattern' : 'field-mapping';
    const val = correctionKey === 'vat-inclusive' ? true : correctionValue;

    await axios.post('http://localhost:3001/api/learn', {
      vendorName: selectedInvoice.vendor, // Use .vendor
      type, key: correctionKey, value: val
    });

    alert("Memory Updated!");
    fetchMemories();
    processInvoice(selectedInvoice); 
  };

  const handleReset = async () => {
    if(!confirm("Are you sure you want to wipe all AI memory?")) return;
    await axios.post('http://localhost:3001/api/reset');
    fetchMemories();
    alert("Memory Wiped.");
    setResult(null);
    setSelectedInvoice(null);
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-800 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Invoices</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
          {/* Updated Sidebar Map with Index Fallback */}
          {invoices.map((inv, index) => { // <--- Added 'index' here
            const isSelected = selectedInvoice?.invoiceId === inv.invoiceId;
            return (
              <div 
                key={inv.invoiceId || index} // <--- Fallback to index if ID is missing
                onClick={() => processInvoice(inv)}
                className={`
                  cursor-pointer p-4 rounded-xl border transition-all duration-200 group
                  ${isSelected 
                    ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500/20' 
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                    {inv.vendor}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {inv.invoiceId || "ID-MISSING"}
                    </span>
                    <div className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        ${inv.fields?.grossTotal?.toFixed(2) ?? "0.00"}
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <TrashIcon className="w-4 h-4" />
            Reset Memory
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm z-[5]">
           <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Invoice Details</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {!selectedInvoice && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-gray-100">
                <FileTextIcon className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">Select an invoice to start</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-blue-600 font-medium animate-pulse">AI Agent is analyzing...</p>
            </div>
          )}

          {result && !loading && selectedInvoice && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedInvoice.invoiceId}</h1>
                       <p className="text-gray-500 text-sm font-mono bg-gray-50 inline-block px-2 py-1 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                         {selectedInvoice.rawText}
                       </p>
                    </div>
                    <div className="text-right">
                       <div className="text-sm text-gray-500">Gross Total</div>
                       <div className="text-2xl font-bold text-gray-900">${selectedInvoice.fields.grossTotal.toFixed(2)}</div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className={`lg:col-span-2 rounded-xl shadow-sm border p-6 ${
                  result.requiresHumanReview 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {result.requiresHumanReview 
                      ? <AlertIcon className="w-8 h-8 text-amber-600" />
                      : <CheckIcon className="w-8 h-8 text-green-600" />
                    }
                    <div>
                      <h2 className={`text-lg font-bold ${
                        result.requiresHumanReview ? 'text-amber-800' : 'text-green-800'
                      }`}>
                        {result.requiresHumanReview ? 'Human Review Required' : 'Auto-Accepted'}
                      </h2>
                      <p className={`text-sm ${
                        result.requiresHumanReview ? 'text-amber-700' : 'text-green-700'
                      }`}>
                        Confidence Score: {(result.confidenceScore * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/60 p-4 rounded-lg border border-black/5 mb-4">
                     <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">AI Reasoning</h3>
                     <p className="text-gray-800">{result.reasoning}</p>
                  </div>

                  {result.proposedCorrections.length > 0 && (
                    <div className="bg-white/80 p-4 rounded-lg border border-black/5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Applied Corrections</h3>
                      <ul className="space-y-1">
                        {result.proposedCorrections.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-800">
                             <CheckIcon className="w-4 h-4 text-green-500" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {result.requiresHumanReview ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit">
                    <h3 className="font-bold text-gray-900 mb-1">🎓 Teach the AI</h3>
                    <p className="text-xs text-gray-500 mb-4">Create a rule to fix this vendor's issues.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Pattern Key</label>
                        <input 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                          placeholder="e.g. Leistungsdatum"
                          value={correctionKey}
                          onChange={e => setCorrectionKey(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Correct Value</label>
                        <input 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                          placeholder="e.g. serviceDate"
                          value={correctionValue}
                          onChange={e => setCorrectionValue(e.target.value)} 
                        />
                      </div>
                      <button 
                        onClick={handleTeach}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors mt-2 shadow-sm"
                      >
                        Save Rule & Retry
                      </button>
                    </div>
                  </div>
                ) : (
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit">
                      <h3 className="font-bold text-gray-900 mb-3">🧠 Active Memories</h3>
                      {memories.filter(m => m.vendorName === selectedInvoice.vendor).length > 0 ? (
                         <div className="space-y-2">
                            {memories.filter(m => m.vendorName === selectedInvoice.vendor).map((m, i) => (
                               <div key={i} className="text-xs bg-blue-50 text-blue-800 px-2 py-1.5 rounded border border-blue-100">
                                  <span className="font-semibold">{m.key}</span> → {String(m.value)}
                               </div>
                            ))}
                         </div>
                      ) : (
                         <p className="text-xs text-gray-400">No specific memories used.</p>
                      )}
                   </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;