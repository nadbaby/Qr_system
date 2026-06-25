'use strict';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, Employee, Counter, MonthlyTarget } from '@/lib/db';
import { 
  User, 
  MapPin, 
  Target, 
  Award, 
  LogOut, 
  TrendingUp, 
  QrCode, 
  MousePointerClick, 
  CheckCircle,
  Trophy,
  RefreshCw,
  X,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';

export default function EmployeeDashboard() {
  const router = useRouter();
  
  // Session states
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [counters, setCounters] = useState<Counter[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [myStats, setMyStats] = useState<any>(null);
  const [myTargets, setMyTargets] = useState<MonthlyTarget[]>([]);

  // QR Modal States
  const [selectedCounterForQr, setSelectedCounterForQr] = useState<Counter | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  const fetchEmployeeData = async (empId: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // 1. Get current month
      const currentMonth = new Date().toISOString().substring(0, 7);

      // 2. Fetch all counters & filter for this employee
      const cList = await db.getCounters();
      const assigned = cList.filter(c => c.employee_id === empId);
      setCounters(assigned);

      // Generate QR codes for all assigned counters
      const qrMap: Record<string, string> = {};
      const baseAppUrl = (typeof window !== 'undefined' && window.location.origin)
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      
      for (const c of assigned) {
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

      // 3. Fetch targets for this employee
      const targetsList = await db.getTargets(currentMonth);
      const myT = targetsList.filter(t => t.employee_id === empId);
      setMyTargets(myT);

      // 4. Fetch Month Analytics for Leaderboard & Stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthAnalytics = await db.getAnalytics({ start: startOfMonth, end: endOfMonth, custom: false });
      setAnalytics(monthAnalytics);

      // Find my rankings & metrics in employee leaderboard
      const meInLeaderboard = monthAnalytics.employeeLeaderboard.find((e: any) => e.employeeId === empId);
      
      // Calculate active scores
      if (meInLeaderboard) {
        setMyStats(meInLeaderboard);
      } else {
        // Fallback if no records exist yet
        // Find default target
        const tVal = myT.reduce((acc, curr) => acc + curr.target_reviews, 0) || 20;
        setMyStats({
          employeeId: empId,
          employeeName: employee?.name || 'Me',
          scans: 0,
          clicks: 0,
          confs: 0,
          score: 0,
          conversionRate: 0,
          target: tVal,
          progress: 0
        });
      }

    } catch (err: any) {
      console.error('Error fetching employee dashboard data:', err);
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openQrModal = (counter: Counter) => {
    setSelectedCounterForQr(counter);
    setQrModalOpen(true);
  };

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

  useEffect(() => {
    const sessionStr = localStorage.getItem('fb_session');
    if (!sessionStr) {
      router.push('/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      if (session.role !== 'employee') {
        router.push('/login');
      } else {
        setEmployee(session);
        fetchEmployeeData(session.id);
      }
    } catch (e) {
      localStorage.removeItem('fb_session');
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('fb_session');
    router.push('/login');
  };

  const handleRefresh = () => {
    if (employee) {
      fetchEmployeeData(employee.id, true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-brand-gray-light">
        <div className="flex flex-col items-center gap-3 animate-pulse-soft">
          <div className="w-10 h-10 rounded-lg bg-brand-orange text-brand-black flex items-center justify-center font-bold text-xl">
            FB
          </div>
          <p className="text-sm font-semibold text-brand-gray-dark">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-brand-gray-light p-4">
        <div className="bg-white rounded-3xl border border-brand-gray-mid p-8 shadow-lg max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <h3 className="text-lg font-bold text-brand-black font-display">Database Access Error</h3>
          <p className="text-sm text-red-600">
            {error}
          </p>
          <p className="text-xs text-brand-gray-dark leading-relaxed">
            This typically happens if your Firestore Database is locked or if the Security Rules are set to deny read/write requests. Please set your Firestore rules to allow public reads and writes for development, or ensure authentication is correctly configured.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-dark text-brand-black rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-brand-black hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find rank
  const myRank = analytics?.employeeLeaderboard ? analytics.employeeLeaderboard.findIndex((e: any) => e.employeeId === employee.id) + 1 : 1;
  const isTopThree = myRank <= 3 && myStats?.score > 0;

  return (
    <div className="flex-1 flex flex-col bg-brand-gray-light min-h-screen">
      
      {/* Top Banner Header */}
      <header className="bg-brand-black text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-lg border-b-4 border-brand-orange">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-orange flex items-center justify-center font-bold text-lg text-brand-black">
            FB
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-wider leading-none">FINE BEARING</h1>
            <p className="text-[9px] text-brand-gray-dark tracking-widest mt-1 uppercase">Staff Dashboard</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="bg-brand-gray-dark/25 hover:bg-red-950/20 text-red-400 font-semibold px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-xs border border-brand-gray-mid/10 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl border border-brand-gray-mid p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative overflow-hidden">
          {/* Subtle Orange Glow background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange-light/30 rounded-full blur-3xl -z-0"></div>

          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange text-brand-black flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {employee.name.substring(0,2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-brand-black">Welcome, {employee.name}!</h2>
              <p className="text-xs text-brand-gray-dark mt-0.5">Let&apos;s provide great service and invite customer reviews today.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto z-10 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-brand-gray-light border border-brand-gray-mid hover:bg-brand-gray-mid rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer text-xs font-bold text-brand-black gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Scoring Card and Counters */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Assigned Counters */}
          <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm md:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-orange" /> Active Counter(s)
              </h3>
              
              <div className="space-y-2.5">
                {counters.map(c => (
                  <div key={c.id} className="p-3 bg-brand-gray-light/45 rounded-xl border border-brand-gray-mid/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-brand-black block">{c.name}</span>
                        <span className="text-[9px] font-mono text-brand-gray-dark block mt-0.5">ID: {c.id}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm" title="Active"></span>
                    </div>

                    {qrCache[c.id] && (
                      <button
                        onClick={() => openQrModal(c)}
                        className="w-full py-1.5 bg-brand-black hover:bg-brand-dark text-brand-orange hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Show QR Code
                      </button>
                    )}
                  </div>
                ))}

                {counters.length === 0 && (
                  <p className="text-xs text-brand-gray-dark italic font-semibold">No counter assigned to you. Contact Admin.</p>
                )}
              </div>
            </div>

            <div className="bg-brand-orange-light/35 p-3 rounded-xl border border-brand-orange/10 mt-5">
              <span className="text-[9px] font-bold text-brand-orange-dark uppercase tracking-wider block">Staff Fair Scoring Guide:</span>
              <ul className="text-[9.5px] font-semibold text-brand-gray-dark space-y-1 mt-1.5 list-disc pl-3">
                <li>QR Code Scan = <strong className="text-brand-black">1 pt</strong></li>
                <li>Google Click = <strong className="text-brand-black">2 pts</strong></li>
                <li>Self-Confirmed Review = <strong className="text-brand-black">5 pts</strong></li>
              </ul>
            </div>
          </div>

          {/* Points & Standing summary */}
          <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm md:col-span-2 space-y-5">
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black flex items-center gap-1.5">
              <Trophy className="w-4.5 h-4.5 text-brand-orange" /> Performance Standing (This Month)
            </h3>

            {myStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Points */}
                <div className="bg-brand-orange-light/20 p-4 rounded-xl border border-brand-orange/10 text-center">
                  <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">My Score</span>
                  <span className="text-2xl font-display font-extrabold text-brand-orange-dark mt-1 block">{myStats.score}</span>
                  <span className="text-[8px] font-bold text-brand-gray-dark block mt-0.5">Points Total</span>
                </div>
                
                {/* Rank */}
                <div className="bg-brand-black text-white p-4 rounded-xl text-center relative overflow-hidden">
                  <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Store Rank</span>
                  <span className="text-2xl font-display font-extrabold text-white mt-1 block">
                    #{myRank}
                  </span>
                  {isTopThree && (
                    <Award className="absolute -bottom-1 -right-1 w-8 h-8 text-brand-orange/20 rotate-12" />
                  )}
                </div>

                {/* Confirmed Reviews */}
                <div className="bg-green-50/40 p-4 rounded-xl border border-green-150/40 text-center">
                  <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Reviews</span>
                  <span className="text-2xl font-display font-extrabold text-green-700 mt-1 block">{myStats.confs}</span>
                  <span className="text-[8px] font-bold text-brand-gray-dark block mt-0.5">Self-Confirmed</span>
                </div>

                {/* Conversion Rate */}
                <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-150/40 text-center">
                  <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Conversion</span>
                  <span className="text-2xl font-display font-extrabold text-purple-700 mt-1 block">{myStats.conversionRate}%</span>
                  <span className="text-[8px] font-bold text-brand-gray-dark block mt-0.5">Clicks / Scans</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-gray-dark italic">No standing data available.</p>
            )}

            {/* Target Progress Section */}
            {myStats && (
              <div className="bg-brand-gray-light/45 p-4 rounded-xl border border-brand-gray-mid/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-black flex items-center gap-1">
                    <Target className="w-4 h-4 text-brand-orange" /> Target Progress
                  </span>
                  <span className="font-extrabold text-brand-orange-dark bg-brand-orange-light px-2.5 py-0.5 rounded-full text-[10px]">{myStats.progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-brand-gray-light h-3 rounded-full overflow-hidden border border-brand-gray-mid relative">
                  <div 
                    className="h-full bg-brand-orange transition-all duration-500 rounded-full" 
                    style={{ width: `${Math.min(myStats.progress, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] font-bold text-brand-gray-dark">
                  <span>{myStats.confs} SUBMITTED REVIEWS</span>
                  <span>TARGET GOAL: {myStats.target}</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Detailed month breakdown list */}
        <div className="bg-white rounded-2xl border border-brand-gray-mid p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-orange" /> My Performance Counters Breakdowns
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Scans */}
            <div className="bg-brand-gray-light/35 p-4 rounded-xl border border-brand-gray-mid/45 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-orange-light text-brand-orange-dark flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">QR Code Scans</span>
                <strong className="text-xl text-brand-black mt-0.5 block">{myStats?.scans || 0}</strong>
              </div>
            </div>

            {/* Clicks */}
            <div className="bg-brand-gray-light/35 p-4 rounded-xl border border-brand-gray-mid/45 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Google Clicks</span>
                <strong className="text-xl text-brand-black mt-0.5 block">{myStats?.clicks || 0}</strong>
              </div>
            </div>

            {/* Confirmations */}
            <div className="bg-brand-gray-light/35 p-4 rounded-xl border border-brand-gray-mid/45 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Confirmations</span>
                <strong className="text-xl text-brand-black mt-0.5 block">{myStats?.confs || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Global Store Employee Leaderboard to motivate */}
        <div className="bg-white rounded-2xl border border-brand-gray-mid p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-orange" /> Store Leaderboard (This Month)
          </h3>

          <div className="space-y-3">
            {analytics?.employeeLeaderboard.map((item: any, idx: number) => {
              const isMe = item.employeeId === employee.id;
              return (
                <div 
                  key={item.employeeId} 
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isMe 
                      ? 'bg-brand-orange-light/35 border-brand-orange ring-1 ring-brand-orange/10' 
                      : 'bg-brand-gray-light/45 border-brand-gray-mid/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      idx === 0 
                        ? 'bg-amber-100 text-amber-800' 
                        : idx === 1 
                        ? 'bg-zinc-200 text-zinc-800' 
                        : idx === 2 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-brand-gray-light text-brand-gray-dark border border-brand-gray-mid/70'
                    }`}>
                      {idx + 1}
                    </span>
                    
                    <span className={`text-xs font-bold truncate block ${isMe ? 'text-brand-orange-dark' : 'text-brand-black'}`}>
                      {item.employeeName} {isMe && '(Me)'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-brand-black block">{item.score} pts</span>
                    <span className="text-[9px] font-semibold text-brand-gray-dark block mt-0.5">{item.confs} confirmed reviews</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-brand-black text-brand-gray-dark py-5 text-center text-[10px] border-t border-brand-dark mt-12 shrink-0">
        <p>&copy; {new Date().getFullYear()} Fine Bearing &amp; Oil Seal Store. All Rights Reserved.</p>
        <p className="mt-0.5 text-brand-orange font-semibold">Fine Bearing Review Tracker v1.0</p>
      </footer>

      {/* --- QR CODE VIEW MODAL --- */}
      {qrModalOpen && selectedCounterForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setQrModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl border border-brand-gray-mid max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 z-10 text-center">
            <div className="bg-brand-black p-5 text-white flex justify-between items-center border-b-2 border-brand-orange">
              <h3 className="font-display font-bold text-sm flex items-center gap-1.5">
                <QrCode className="w-4.5 h-4.5 text-brand-orange" /> Counter QR Code
              </h3>
              <button onClick={() => setQrModalOpen(false)} className="text-brand-gray-dark hover:text-white"><X className="w-5.5 h-5.5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-base text-brand-black">{selectedCounterForQr.name}</h4>
                <p className="text-xs text-brand-gray-dark font-medium">Show this QR code to the customer to scan</p>
              </div>

              <div className="p-4 bg-brand-gray-light rounded-2xl border border-brand-gray-mid/60 inline-block shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={qrCache[selectedCounterForQr.id]} 
                  alt={`QR Code for ${selectedCounterForQr.name}`} 
                  className="w-56 h-56 bg-white mx-auto rounded-lg shadow-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadQr(selectedCounterForQr)}
                  className="flex-1 bg-brand-gray-light border border-brand-gray-mid hover:bg-brand-gray-mid text-brand-black font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download QR
                </button>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
