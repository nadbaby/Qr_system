'use strict';

'use client';

import { useState, useEffect, useRef } from 'react';
import { db, Counter, Employee } from '@/lib/db';
import { 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  Check, 
  X, 
  ExternalLink,
  Search,
  MapPin,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminCounters() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [search, setSearch] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);

  // Form Fields
  const [counterId, setCounterId] = useState('');
  const [counterName, setCounterName] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [counterActive, setCounterActive] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // QR Code States
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const cardPrintRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const cData = await db.getCounters();
      const eData = await db.getEmployees();
      setCounters(cData);
      setEmployees(eData.filter((e: Employee) => e.active));
      
      // Generate QR codes for all counters on load
      const qrMap: Record<string, string> = {};
      const baseAppUrl = (typeof window !== 'undefined' && window.location.origin)
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      
      for (const c of cData) {
        const trackingUrl = `${baseAppUrl}/review?counter=${c.id}`;
        try {
          const qrUrl = await QRCode.toDataURL(trackingUrl, { 
            width: 300, 
            margin: 1, 
            color: { dark: '#000000', light: '#FFFFFF' } 
          });
          qrMap[c.id] = qrUrl;
        } catch (err) {
          console.error(`Error generating QR for ${c.id}:`, err);
        }
      }
      setQrCache(qrMap);
    } catch (e) {
      console.error('Error loading counters data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTrackingUrl = (id: string) => {
    const baseAppUrl = (typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    return `${baseAppUrl}/review?counter=${id}`;
  };

  // Add counter handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate counter ID: lower-case, alphanumeric, hyphens
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(counterId)) {
      setError('Counter ID must contain only lowercase letters, numbers, and hyphens (e.g., billing, desk-1).');
      return;
    }

    if (!counterName.trim()) {
      setError('Please provide a counter name.');
      return;
    }

    setSubmitting(true);
    try {
      await db.addCounter({
        id: counterId,
        name: counterName,
        employee_id: assignedEmployeeId || null,
        active: counterActive
      });
      setAddOpen(false);
      
      // Reset
      setCounterId('');
      setCounterName('');
      setAssignedEmployeeId('');
      setCounterActive(true);
      
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add counter. Note: ID must be unique.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEdit = (counter: Counter) => {
    setSelectedCounter(counter);
    setCounterId(counter.id);
    setCounterName(counter.name);
    setAssignedEmployeeId(counter.employee_id || '');
    setCounterActive(counter.active);
    setError(null);
    setEditOpen(true);
  };

  // Edit submit handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounter) return;
    setError(null);

    if (!counterName.trim()) {
      setError('Please provide a counter name.');
      return;
    }

    setSubmitting(true);
    try {
      await db.updateCounter(selectedCounter.id, {
        name: counterName,
        employee_id: assignedEmployeeId || null,
        active: counterActive
      });
      setEditOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update counter.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete counter
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this counter? This will remove all linked review scan analytics.')) {
      return;
    }
    try {
      await db.deleteCounter(id);
      await fetchData();
    } catch (e) {
      alert('Error deleting counter.');
    }
  };

  // Download raw QR code PNG
  const downloadQr = (counter: Counter) => {
    const qrData = qrCache[counter.id];
    if (!qrData) return;
    
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `fb_qr_${counter.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Card Modal open
  const openCardPrint = (counter: Counter) => {
    setSelectedCounter(counter);
    setCardOpen(true);
  };

  // Print action
  const handlePrint = () => {
    window.print();
  };

  // Filter counters based on search query
  const filteredCounters = counters.filter(c => 
    c.id.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.employee?.name && c.employee.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black tracking-tight">
            Counter Management
          </h2>
          <p className="text-brand-gray-dark text-xs mt-1">
            Create tracking codes, download printable display cards, and assign staff.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setAddOpen(true); }}
          className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" /> Add New Counter
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-brand-gray-mid p-4 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-brand-gray-dark shrink-0" />
        <input
          type="text"
          placeholder="Search counters by ID, name, or staff member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium text-brand-black focus:outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-sm font-semibold text-brand-gray-dark animate-pulse-soft">Loading counters data...</p>
        </div>
      ) : (
        /* Counters Table / Grid */
        <div className="bg-white border border-brand-gray-mid rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-black text-white text-[10px] font-bold uppercase tracking-wider border-b border-brand-orange">
                  <th className="py-4 px-5">Counter ID / Name</th>
                  <th className="py-4 px-5">Assigned Employee</th>
                  <th className="py-4 px-5">Tracking Link</th>
                  <th className="py-4 px-5 text-center">QR Code</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-mid text-xs">
                {filteredCounters.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-brand-gray-light/35 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-brand-black">{ctr.name}</div>
                      <div className="text-[10px] text-brand-gray-dark font-mono mt-0.5">{ctr.id}</div>
                    </td>
                    <td className="py-4 px-5">
                      {ctr.employee ? (
                        <span className="font-semibold text-brand-black">{ctr.employee.name}</span>
                      ) : (
                        <span className="text-brand-gray-dark italic font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-5 max-w-[200px] truncate">
                      <a 
                        href={getTrackingUrl(ctr.id)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-brand-orange hover:text-brand-orange-dark font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        {ctr.id} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {qrCache[ctr.id] ? (
                        <div className="inline-flex flex-col items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={qrCache[ctr.id]} 
                            alt={`QR Code for ${ctr.name}`} 
                            className="w-12 h-12 border border-brand-gray-mid rounded p-0.5 bg-white shadow-xs"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => downloadQr(ctr)}
                              className="text-[9px] font-bold text-brand-black bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark px-1.5 py-0.5 rounded border border-brand-gray-mid"
                              title="Download PNG"
                            >
                              PNG
                            </button>
                            <button
                              onClick={() => openCardPrint(ctr)}
                              className="text-[9px] font-bold text-brand-black bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark px-1.5 py-0.5 rounded border border-brand-gray-mid flex items-center gap-0.5"
                              title="Print Display Sign"
                            >
                              <Printer className="w-2.5 h-2.5" /> Sign
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-red-500 font-semibold">Generating...</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ctr.active 
                          ? 'bg-green-50 text-green-700 border border-green-150' 
                          : 'bg-red-50 text-red-700 border border-red-150'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ctr.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {ctr.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(ctr)}
                          className="p-2 text-brand-gray-dark hover:text-brand-black bg-brand-gray-light hover:bg-brand-gray-mid rounded-lg transition-colors cursor-pointer"
                          title="Edit Counter"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ctr.id)}
                          className="p-2 text-brand-gray-dark hover:text-red-600 bg-brand-gray-light hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Counter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCounters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-gray-dark italic font-semibold">
                      No counters found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAddOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" /> Register New Counter
              </h3>
              <button onClick={() => setAddOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Counter ID (URL Slug)</label>
                <input
                  type="text"
                  placeholder="e.g. billing-counter, counter-2"
                  value={counterId}
                  onChange={(e) => setCounterId(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
                <p className="text-[9px] text-brand-gray-dark mt-1 font-semibold">
                  Used in URL: {getTrackingUrl(counterId || '{id}')}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Counter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main Billing Desk"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Assigned Employee</label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs bg-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="">Unassigned / No Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="add-active"
                  checked={counterActive}
                  onChange={(e) => setCounterActive(e.target.checked)}
                  className="w-4 h-4 text-brand-orange border-brand-gray-mid rounded focus:ring-brand-orange"
                />
                <label htmlFor="add-active" className="text-xs font-bold text-brand-black select-none cursor-pointer">
                  Mark Counter as Active
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="flex-1 bg-brand-gray-light hover:bg-brand-gray-mid text-brand-black font-semibold py-2.5 rounded-xl border border-brand-gray-mid text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editOpen && selectedCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-orange" /> Edit Counter
              </h3>
              <button onClick={() => setEditOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Counter ID (URL Slug)</label>
                <input
                  type="text"
                  value={counterId}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs bg-brand-gray-light text-brand-gray-dark cursor-not-allowed focus:outline-none"
                  disabled
                />
                <p className="text-[9px] text-brand-gray-dark mt-1 font-semibold">
                  Slug IDs cannot be changed to prevent broken URL QR codes.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Counter Name</label>
                <input
                  type="text"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Assigned Employee</label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs bg-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="">Unassigned / No Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={counterActive}
                  onChange={(e) => setCounterActive(e.target.checked)}
                  className="w-4 h-4 text-brand-orange border-brand-gray-mid rounded focus:ring-brand-orange"
                />
                <label htmlFor="edit-active" className="text-xs font-bold text-brand-black select-none cursor-pointer">
                  Mark Counter as Active
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 bg-brand-gray-light hover:bg-brand-gray-mid text-brand-black font-semibold py-2.5 rounded-xl border border-brand-gray-mid text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE QR CARD SIGN MODAL --- */}
      {cardOpen && selectedCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setCardOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-lg w-full overflow-hidden shadow-2xl flex flex-col z-10 print:fixed print:inset-0 print:border-none print:shadow-none print:p-0 print:m-0 max-h-[90vh]">
            
            {/* Header controls (Hidden on printing) */}
            <div className="bg-brand-black p-4 text-white flex justify-between items-center border-b border-brand-orange shrink-0 print:hidden">
              <h3 className="font-display font-bold text-xs flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-brand-orange" /> Print Review QR Sign Card
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-brand-orange text-brand-black text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow hover:bg-brand-orange-dark transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Sign
                </button>
                <button onClick={() => setCardOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Scrollable container for screen preview */}
            <div className="flex-1 overflow-y-auto p-8 bg-brand-gray-light/65 flex justify-center items-center print:p-0 print:overflow-visible print:bg-white">
              
              {/* PRINTABLE QR CARD SIGN */}
              <div 
                ref={cardPrintRef}
                className="w-[320px] bg-white border-[6px] border-brand-orange p-6 text-center flex flex-col justify-between items-center rounded-2xl shadow-xl aspect-[1/1.4] print:shadow-none print:border-[12px] print:w-full print:h-full print:rounded-none print:aspect-auto"
                style={{ contentVisibility: 'auto' }}
              >
                {/* Brand Header */}
                <div className="w-full">
                  <div className="inline-flex items-center justify-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded bg-brand-black text-brand-orange font-extrabold text-xs flex items-center justify-center">
                      FB
                    </div>
                    <span className="font-display font-extrabold text-[13px] text-brand-black tracking-wide">FINE BEARING</span>
                  </div>
                  <p className="text-[7.5px] font-bold text-brand-gray-dark uppercase tracking-widest leading-none">
                    &amp; Oil Seal Store
                  </p>
                  
                  <div className="w-full border-b border-brand-gray-mid my-3"></div>
                </div>

                {/* Promotional Slogan */}
                <div className="my-1.5">
                  <h4 className="font-display font-extrabold text-lg text-brand-black leading-tight">
                    Loved our service?
                  </h4>
                  <p className="text-[10px] font-semibold text-brand-gray-dark mt-1 leading-snug">
                    Scan &amp; share your honest Google Review
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-brand-gray-light rounded-xl border border-brand-gray-mid/65 inline-block my-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={qrCache[selectedCounter.id]} 
                    alt={`QR Code Card Sign for ${selectedCounter.name}`} 
                    className="w-36 h-36 bg-white"
                  />
                </div>

                {/* Footer instructions */}
                <div className="w-full">
                  <p className="text-[8px] font-bold text-brand-black">
                    Thank you for helping us serve you better!
                  </p>
                  
                  <div className="w-full border-b border-brand-gray-mid my-3"></div>

                  {/* Subtly print counter name at the bottom for internal identification */}
                  <span className="text-[8px] font-mono font-bold text-brand-gray-dark uppercase tracking-wider bg-brand-gray-light px-2 py-0.5 rounded border border-brand-gray-mid/40">
                    ID: {selectedCounter.id} ({selectedCounter.name})
                  </span>
                </div>

              </div>
            </div>

            {/* Custom Print CSS Injector */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print\\:fixed, .print\\:fixed * {
                  visibility: visible;
                }
                .print\\:fixed {
                  position: fixed;
                  left: 0;
                  top: 0;
                  width: 100vw;
                  height: 100vh;
                  z-index: 9999;
                  background: white !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}

    </div>
  );
}
