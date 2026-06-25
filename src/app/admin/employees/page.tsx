'use strict';

'use client';

import { useState, useEffect } from 'react';
import { db, Employee, Counter, MonthlyTarget } from '@/lib/db';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  X, 
  Check, 
  Search,
  Key,
  Calendar,
  AlertCircle,
  Hash
} from 'lucide-react';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Profile Form Fields
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPasscode, setEmpPasscode] = useState('');
  const [empActive, setEmpActive] = useState(true);
  
  // Target Form Fields
  const [targetMonth, setTargetMonth] = useState('');
  const [targetCounterId, setTargetCounterId] = useState('');
  const [targetReviewsCount, setTargetReviewsCount] = useState(20);

  // Points Form Fields
  const [pointsActionType, setPointsActionType] = useState<'adjust' | 'reset'>('adjust');
  const [adjustPointsValue, setAdjustPointsValue] = useState(5);
  const [adjustReason, setAdjustReason] = useState('');
  const [currentEmpScore, setCurrentEmpScore] = useState(0);
  
  // Error & Status
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const eData = await db.getEmployees();
      const cData = await db.getCounters();
      const tData = await db.getTargets();
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const analyticsData = await db.getAnalytics({ start: startOfMonth, end: endOfMonth, custom: false });

      setEmployees(eData);
      setCounters(cData);
      setTargets(tData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Error fetching employees data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Default target month to current month YYYY-MM
    setTargetMonth(new Date().toISOString().substring(0, 7));
  }, []);

  // Points Handlers
  const openPointsManager = (employee: Employee, score: number) => {
    setSelectedEmployee(employee);
    setCurrentEmpScore(score);
    setAdjustPointsValue(5);
    setAdjustReason('');
    setPointsActionType('adjust');
    setError(null);
    setPointsOpen(true);
  };

  const handlePointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setError(null);
    setSubmitting(true);

    try {
      if (pointsActionType === 'reset') {
        await db.resetScore(selectedEmployee.id, currentEmpScore);
      } else {
        // Adjust points (subtract points value from score)
        await db.adjustScore(selectedEmployee.id, -adjustPointsValue, adjustReason || 'Manual Admin Deduction');
      }
      setPointsOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust points.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form submits
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!empEmail.includes('@') || !empEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    // Validate passcode: must be digits
    if (!/^\d+$/.test(empPasscode) || empPasscode.length < 4) {
      setError('PIN Passcode must be at least a 4-digit number (e.g., 1001).');
      return;
    }

    setSubmitting(true);
    try {
      await db.addEmployee({
        name: empName,
        email: empEmail,
        passcode: empPasscode,
        active: empActive
      });
      setAddOpen(false);
      
      // Reset
      setEmpName('');
      setEmpEmail('');
      setEmpPasscode('');
      setEmpActive(true);
      
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to register employee. Note: Email must be unique.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Profile
  const openEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmpName(employee.name);
    setEmpEmail(employee.email);
    setEmpPasscode(employee.passcode);
    setEmpActive(employee.active);
    setError(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setError(null);

    if (!empEmail.includes('@') || !empEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!/^\d+$/.test(empPasscode) || empPasscode.length < 4) {
      setError('PIN Passcode must be at least a 4-digit number.');
      return;
    }

    setSubmitting(true);
    try {
      await db.updateEmployee(selectedEmployee.id, {
        name: empName,
        email: empEmail,
        passcode: empPasscode,
        active: empActive
      });
      setEditOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? This will unassign them from any active counters, but their historical scan records will remain.')) {
      return;
    }
    try {
      await db.deleteEmployee(id);
      await fetchData();
    } catch (e) {
      alert('Error deleting employee.');
    }
  };

  // Open Target Manager
  const openTargetManager = (employee: Employee) => {
    setSelectedEmployee(employee);
    // Find active counter for this employee, if any
    const activeCtr = counters.find(c => c.employee_id === employee.id);
    setTargetCounterId(activeCtr ? activeCtr.id : counters[0]?.id || '');
    
    // Find current target for this month if exists
    const currentMonth = new Date().toISOString().substring(0, 7);
    const existing = targets.find(t => t.employee_id === employee.id && t.target_month === currentMonth);
    setTargetReviewsCount(existing ? existing.target_reviews : 20);
    setTargetMonth(currentMonth);
    
    setError(null);
    setTargetOpen(true);
  };

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !targetCounterId) return;
    setError(null);

    setSubmitting(true);
    try {
      await db.saveTarget({
        employee_id: selectedEmployee.id,
        counter_id: targetCounterId,
        target_month: targetMonth,
        target_reviews: Number(targetReviewsCount)
      });
      setTargetOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save monthly target.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.passcode.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black tracking-tight">
            Employee Management
          </h2>
          <p className="text-brand-gray-dark text-xs mt-1">
            Register sales staff, configure login credentials, and set review goals.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setAddOpen(true); }}
          className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" /> Register Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-brand-gray-mid p-4 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-brand-gray-dark shrink-0" />
        <input
          type="text"
          placeholder="Search staff by name, email, or passcode PIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium text-brand-black focus:outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-sm font-semibold text-brand-gray-dark animate-pulse-soft">Loading employees data...</p>
        </div>
      ) : (
        /* Employees Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            // Find employee's assigned counter(s)
            const assignedCtrs = counters.filter(c => c.employee_id === emp.id);
            // Find employee's monthly target
            const currentMonth = new Date().toISOString().substring(0, 7);
            const monthlyT = targets.find(t => t.employee_id === emp.id && t.target_month === currentMonth);
            
            // Find employee's current score from analytics
            const empAnalytics = analytics?.employeeLeaderboard?.find((e: any) => e.employeeId === emp.id);
            const empScore = empAnalytics?.score || 0;

            return (
              <div 
                key={emp.id} 
                className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Name and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-display font-extrabold text-sm text-brand-black">{emp.name}</h3>
                      <p className="text-[10px] text-brand-gray-dark truncate mt-0.5">{emp.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      emp.active 
                        ? 'bg-green-50 text-green-700 border border-green-150' 
                        : 'bg-red-50 text-red-700 border border-red-150'
                    }`}>
                      {emp.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="border-t border-brand-gray-light my-4"></div>

                  {/* Body: Credentials & Counters */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-brand-gray-dark">
                      <span className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
                        <Key className="w-3.5 h-3.5 text-brand-orange" /> Passcode PIN:
                      </span>
                      <span className="font-mono font-bold text-brand-black bg-brand-gray-light px-2 py-0.5 rounded border border-brand-gray-mid/60">
                        {emp.passcode}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider block">Assigned Counters:</span>
                      {assignedCtrs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                           {assignedCtrs.map(c => (
                            <span 
                              key={c.id} 
                              className="text-[10px] bg-brand-orange-light text-brand-orange-dark font-bold px-2 py-0.5 rounded border border-brand-orange/10"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-brand-gray-dark italic font-semibold block mt-1">None (Unassigned)</span>
                      )}
                    </div>

                    {/* Monthly Target */}
                    <div className="bg-brand-gray-light/45 p-3 rounded-xl border border-brand-gray-mid/50 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Target ({currentMonth})</span>
                        <span className="text-xs font-extrabold text-brand-black mt-0.5 block">
                          {monthlyT ? `${monthlyT.target_reviews} Google Reviews` : 'No Target Set'}
                        </span>
                      </div>
                      <button
                        onClick={() => openTargetManager(emp)}
                        className="bg-brand-black hover:bg-brand-dark text-white text-[9px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Target className="w-3 h-3 text-brand-orange" /> Target
                      </button>
                    </div>

                    {/* Points & Score */}
                    <div className="bg-brand-gray-light/45 p-3 rounded-xl border border-brand-gray-mid/50 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Current Score</span>
                        <span className="text-xs font-extrabold text-brand-black mt-0.5 block">
                          {empScore} Points
                        </span>
                      </div>
                      <button
                        onClick={() => openPointsManager(emp, empScore)}
                        className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        Reduce / Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex gap-2.5 mt-5 pt-3 border-t border-brand-gray-light">
                  <button
                    onClick={() => openEdit(emp)}
                    className="flex-1 bg-brand-gray-light hover:bg-brand-gray-mid text-brand-black font-semibold py-2 rounded-xl text-[11px] border border-brand-gray-mid/70 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-2 text-brand-gray-dark hover:text-red-600 bg-brand-gray-light hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white border border-brand-gray-mid rounded-2xl">
              <p className="text-sm text-brand-gray-dark italic font-semibold">No employees found matching search query.</p>
            </div>
          )}
        </div>
      )}

      {/* --- ADD PROFILE MODAL --- */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAddOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-orange" /> Register Employee Profile
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
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@finebearing.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Dashboard PIN Passcode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 1006"
                  value={empPasscode}
                  onChange={(e) => setEmpPasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange font-mono tracking-widest"
                  required
                />
                <p className="text-[8px] text-brand-gray-dark mt-1 font-semibold">
                  Numeric code used by the employee to log in to their dashboard. Minimum 4 digits.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="add-emp-active"
                  checked={empActive}
                  onChange={(e) => setEmpActive(e.target.checked)}
                  className="w-4 h-4 text-brand-orange border-brand-gray-mid rounded focus:ring-brand-orange"
                />
                <label htmlFor="add-emp-active" className="text-xs font-bold text-brand-black select-none cursor-pointer">
                  Mark Employee as Active
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

      {/* --- EDIT PROFILE MODAL --- */}
      {editOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-orange" /> Edit Employee Profile
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
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Dashboard PIN Passcode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={empPasscode}
                  onChange={(e) => setEmpPasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange font-mono tracking-widest"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-emp-active"
                  checked={empActive}
                  onChange={(e) => setEmpActive(e.target.checked)}
                  className="w-4 h-4 text-brand-orange border-brand-gray-mid rounded focus:ring-brand-orange"
                />
                <label htmlFor="edit-emp-active" className="text-xs font-bold text-brand-black select-none cursor-pointer">
                  Employee is Active
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

      {/* --- MONTHLY TARGET SETTING MODAL --- */}
      {targetOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setTargetOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-orange" /> Set Monthly Review Target
              </h3>
              <button onClick={() => setTargetOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleTargetSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-brand-orange-light/45 p-3 rounded-xl border border-brand-orange/10 mb-2">
                <p className="text-xs font-semibold text-brand-black">Staff Target Config</p>
                <p className="text-[10px] text-brand-orange-dark font-bold mt-0.5">Setting monthly target for {selectedEmployee.name}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Target Month</label>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Applicable Counter</label>
                <select
                  value={targetCounterId}
                  onChange={(e) => setTargetCounterId(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs bg-white focus:outline-none focus:border-brand-orange font-medium"
                  required
                >
                  <option value="" disabled>Select a counter...</option>
                  {counters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Target Google Reviews (Count)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 w-4.5 h-4.5 text-brand-gray-dark" />
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    placeholder="20"
                    value={targetReviewsCount}
                    onChange={(e) => setTargetReviewsCount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-brand-gray-mid rounded-xl text-xs font-bold focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>
                <p className="text-[8.5px] text-brand-gray-dark mt-1 font-semibold">
                  The goal of customer-confirmed reviews this employee should achieve at this counter in the target month.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setTargetOpen(false)}
                  className="flex-1 bg-brand-gray-light hover:bg-brand-gray-mid text-brand-black font-semibold py-2.5 rounded-xl border border-brand-gray-mid text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving Target...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- POINTS & SCORE ADJUSTMENT MODAL --- */}
      {pointsOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPointsOpen(false)}></div>
          <div className="relative bg-white rounded-2xl border border-brand-gray-mid max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Hash className="w-5 h-5 text-brand-orange" /> Manage Points: {selectedEmployee.name}
              </h3>
              <button onClick={() => setPointsOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handlePointsSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-brand-gray-light p-4 rounded-xl border border-brand-gray-mid/65 text-center">
                <span className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider block">Current Score Standing</span>
                <span className="text-2xl font-extrabold text-brand-black mt-1 block">{currentEmpScore} Points</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-2">Select Score Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPointsActionType('adjust')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                      pointsActionType === 'adjust'
                        ? 'border-brand-orange bg-brand-orange-light text-brand-orange-dark shadow-xs'
                        : 'border-brand-gray-mid hover:bg-brand-gray-light text-brand-gray-dark'
                    }`}
                  >
                    Deduct Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsActionType('reset')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                      pointsActionType === 'reset'
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-xs'
                        : 'border-brand-gray-mid hover:bg-brand-gray-light text-brand-gray-dark'
                    }`}
                  >
                    Reset to 0
                  </button>
                </div>
              </div>

              {pointsActionType === 'adjust' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Points to Deduct</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 w-4.5 h-4.5 text-brand-gray-dark" />
                      <input
                        type="number"
                        min={1}
                        max={currentEmpScore}
                        placeholder="5"
                        value={adjustPointsValue}
                        onChange={(e) => setAdjustPointsValue(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-9 pr-3 py-2 border border-brand-gray-mid rounded-xl text-xs font-bold focus:outline-none focus:border-brand-orange"
                        required
                      />
                    </div>
                    <p className="text-[9px] text-brand-gray-dark mt-1 font-semibold">
                      This number of points will be subtracted from the employee's dynamic standings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-1.5">Deduction Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Customer complaint, fake confirmation"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                      required
                    />
                  </div>
                </>
              )}

              {pointsActionType === 'reset' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-150 text-xs leading-relaxed">
                  <strong>Warning:</strong> This will create a penalty adjustment of <strong>-{currentEmpScore} points</strong> to reset the staff member's total points to 0. Historical logs are preserved, but their active score on the leaderboard will start over from 0.
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPointsOpen(false)}
                  className="flex-1 bg-brand-gray-light hover:bg-brand-gray-mid text-brand-black font-semibold py-2.5 rounded-xl border border-brand-gray-mid text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 ${
                    pointsActionType === 'reset' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-brand-orange hover:bg-brand-orange-dark text-brand-black'
                  }`}
                >
                  {submitting ? 'Applying...' : pointsActionType === 'reset' ? 'Confirm Reset' : 'Deduct Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
