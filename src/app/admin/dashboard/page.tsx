'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { 
  QrCode, 
  MousePointerClick, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  Download, 
  Award, 
  Zap, 
  Percent, 
  Clock,
  User,
  MapPin,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  // Filter States
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  
  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute date boundaries
  const getDateRange = useCallback((type: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (type === 'today') {
      return { start, end, custom: false };
    } else if (type === 'week') {
      // Start of current week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      return { start, end, custom: false };
    } else if (type === 'month') {
      // Start of current month
      start.setDate(1);
      return { start, end, custom: false };
    } else {
      // Custom date
      const s = startDateStr ? new Date(startDateStr) : new Date();
      s.setHours(0, 0, 0, 0);
      const e = endDateStr ? new Date(endDateStr) : new Date();
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, custom: true };
    }
  }, [startDateStr, endDateStr]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const range = getDateRange(filterType);
      const data = await db.getAnalytics(range);
      setAnalytics(data);
    } catch (e: any) {
      console.error('Error fetching dashboard analytics:', e);
      setError(e.message || 'Error fetching dashboard analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, getDateRange]);

  // Auto set initial custom dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setStartDateStr(firstDay.toISOString().split('T')[0]);
    setEndDateStr(now.toISOString().split('T')[0]);
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchAnalytics();
  }, [filterType, fetchAnalytics]);

  // Handle manual custom range submit
  const handleCustomRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  // Export analytics summary to CSV
  const handleExportCSV = () => {
    if (!analytics) return;

    const separator = ',';
    
    // 1. General Metrics
    let csvContent = 'Fine Bearing Review Tracker - Analytics Report\n';
    csvContent += `Generated at: ${new Date().toLocaleString()}\n`;
    csvContent += `Filter Range: ${filterType.toUpperCase()}\n`;
    csvContent += `Start Date: ${getDateRange(filterType).start.toLocaleDateString()}\n`;
    csvContent += `End Date: ${getDateRange(filterType).end.toLocaleDateString()}\n\n`;

    csvContent += '--- METRICS SUMMARY ---\n';
    csvContent += 'Metric,Count\n';
    csvContent += `Total Scans,${analytics.metrics.totalScans}\n`;
    csvContent += `Google Review Clicks,${analytics.metrics.totalClicks}\n`;
    csvContent += `Customer Confirmations,${analytics.metrics.totalConfirmations}\n`;
    csvContent += `Conversion Rate,${analytics.metrics.conversionRate}%\n\n`;

    // 2. Counter Leaderboard
    csvContent += '--- COUNTER LEADERBOARD ---\n';
    csvContent += 'Counter ID,Counter Name,Assigned Employee,Scans,Clicks,Confirmations,Score,Conversion Rate\n';
    analytics.counterLeaderboard.forEach((c: any) => {
      csvContent += `"${c.counterId}","${c.counterName}","${c.employeeName}",${c.scans},${c.clicks},${c.confs},${c.score},${c.conversionRate}%\n`;
    });
    csvContent += '\n';

    // 3. Employee Leaderboard
    csvContent += '--- EMPLOYEE LEADERBOARD ---\n';
    csvContent += 'Employee Name,Email,Scans,Clicks,Confirmations,Score,Conversion Rate,Target,Target Progress\n';
    analytics.employeeLeaderboard.forEach((e: any) => {
      csvContent += `"${e.employeeName}","${e.email}",${e.scans},${e.clicks},${e.confs},${e.score},${e.conversionRate}%,${e.target},${e.progress}%\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fine_bearing_analytics_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-pulse-soft">
          <div className="w-10 h-10 rounded-lg bg-brand-orange text-brand-black flex items-center justify-center font-bold text-xl">
            FB
          </div>
          <p className="text-sm font-semibold text-brand-gray-dark">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 max-w-md text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <h3 className="text-lg font-bold">Database Access Error</h3>
          <p className="text-sm text-red-600">
            {error}
          </p>
          <p className="text-xs text-brand-gray-dark leading-relaxed">
            This typically happens if your Firestore Database is locked or if the Security Rules are set to deny read/write requests. Please set your Firestore rules to allow public reads and writes for development, or ensure authentication is correctly configured.
          </p>
          <button 
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-brand-black hover:bg-brand-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-brand-gray-dark">No analytics data available.</p>
      </div>
    );
  }

  const { metrics, counterLeaderboard, employeeLeaderboard, timelineData, activities, highlights } = analytics;

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-brand-gray-dark text-xs mt-1">
            Real-time insights on customer feedback and sales counter performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-brand-gray-mid hover:bg-brand-gray-light rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-brand-black ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-brand-black hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4 text-brand-orange" /> Export Report
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-brand-gray-mid p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-orange shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-black">Timeframe:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month', 'custom'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                filterType === type 
                  ? 'bg-brand-orange text-brand-black border-brand-orange shadow-sm' 
                  : 'bg-brand-gray-light/50 text-brand-gray-dark hover:bg-brand-gray-light border-brand-gray-mid/60'
              }`}
            >
              {type === 'week' ? 'This Week' : type === 'month' ? 'This Month' : type}
            </button>
          ))}
        </div>

        {filterType === 'custom' && (
          <form onSubmit={handleCustomRangeSubmit} className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2 md:mt-0 bg-brand-gray-light/30 p-2.5 rounded-xl border border-brand-gray-mid">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="bg-white px-2.5 py-1.5 border border-brand-gray-mid rounded-lg text-xs font-medium focus:outline-none focus:border-brand-orange"
              />
              <span className="text-xs font-semibold text-brand-gray-dark">to</span>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="bg-white px-2.5 py-1.5 border border-brand-gray-mid rounded-lg text-xs font-medium focus:outline-none focus:border-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-black hover:bg-brand-dark text-white text-[11px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-5 border border-brand-gray-mid shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider">Total Scans</p>
              <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black mt-1.5">{metrics.totalScans}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-orange-light text-brand-orange-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] font-semibold text-brand-gray-dark mt-4 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            <span>Recorded QR scans</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-5 border border-brand-gray-mid shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider">Google Clicks</p>
              <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black mt-1.5">{metrics.totalClicks}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] font-semibold text-brand-gray-dark mt-4 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Write Review clicks</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-5 border border-brand-gray-mid shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider">Confirmed Submits</p>
              <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black mt-1.5">{metrics.totalConfirmations}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] font-semibold text-brand-gray-dark mt-4 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-green-500" />
            <span>Self-confirmed by user</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-5 border border-brand-gray-mid shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-wider">Conversion Rate</p>
              <h3 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black mt-1.5">{metrics.conversionRate}%</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] font-semibold text-brand-gray-dark mt-4 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
            <span>Clicks / Scans ratio</span>
          </div>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="bg-white border border-brand-gray-mid rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-5 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-orange" /> Performance Champions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* H1 */}
          <div className="bg-brand-gray-light/45 p-4 rounded-xl border border-brand-gray-mid/60 text-center flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Today&apos;s Top Counter</span>
            <span className="text-sm font-bold text-brand-black mt-2 block truncate max-w-full">{highlights.topCounterName}</span>
            <span className="text-xs bg-brand-orange-light text-brand-orange-dark font-bold px-2 py-0.5 rounded-full mt-1.5">{highlights.topCounterScore} pts</span>
          </div>
          {/* H2 */}
          <div className="bg-brand-gray-light/45 p-4 rounded-xl border border-brand-gray-mid/60 text-center flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Top Employee</span>
            <span className="text-sm font-bold text-brand-black mt-2 block truncate max-w-full">{highlights.topEmployeeName}</span>
            <span className="text-xs bg-brand-orange-light text-brand-orange-dark font-bold px-2 py-0.5 rounded-full mt-1.5">{highlights.topEmployeeScore} pts</span>
          </div>
          {/* H3 */}
          <div className="bg-brand-gray-light/45 p-4 rounded-xl border border-brand-gray-mid/60 text-center flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Best Conversion</span>
            <span className="text-sm font-bold text-brand-black mt-2 block truncate max-w-full">{highlights.bestConversionName}</span>
            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full mt-1.5">{highlights.bestConversionRate}%</span>
          </div>
          {/* H4 */}
          <div className="bg-brand-gray-light/45 p-4 rounded-xl border border-brand-gray-mid/60 text-center flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-brand-gray-dark uppercase tracking-wider block">Monthly Review Champ</span>
            <span className="text-sm font-bold text-brand-black mt-2 block truncate max-w-full">{highlights.monthlyChampName}</span>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full mt-1.5">{highlights.monthlyChampCount} reviews</span>
          </div>
        </div>
      </div>

      {/* Analytics Custom Chart */}
      <div className="bg-white rounded-2xl border border-brand-gray-mid p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black">QR Scan Activity vs. Review Clicks</h3>
            <p className="text-[11px] text-brand-gray-dark mt-0.5">Visualizing customer progression through the scanning process.</p>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-brand-orange rounded-full"></span>
              <span className="text-brand-black">Scans</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-brand-black">Clicks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-brand-black">Confirmations</span>
            </div>
          </div>
        </div>

        {/* Custom Bar Graph */}
        {timelineData.length === 0 ? (
          <div className="h-48 bg-brand-gray-light/35 rounded-xl border border-dashed border-brand-gray-mid flex items-center justify-center text-xs text-brand-gray-dark font-medium">
            No activity registered in this period
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {timelineData.slice(-7).map((item: any, idx: number) => {
              const maxVal = Math.max(...timelineData.map((d: any) => d.scans), 1);
              const scanPct = (item.scans / maxVal) * 100;
              const clickPct = (item.clicks / maxVal) * 100;
              const confPct = (item.confs / maxVal) * 100;
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-24 text-[10px] font-bold text-brand-gray-dark truncate text-right shrink-0">{item.date}</span>
                  
                  {/* Bars Container */}
                  <div className="flex-1 space-y-1 bg-brand-gray-light/50 p-2 rounded-lg border border-brand-gray-mid/40">
                    {/* Scan Bar */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-brand-orange transition-all duration-500 min-w-[4px]" 
                        style={{ width: `${Math.max(scanPct, 2)}%` }}
                      ></div>
                      <span className="text-[9px] font-bold text-brand-black">{item.scans}</span>
                    </div>

                    {/* Click Bar */}
                    {item.clicks > 0 && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500 transition-all duration-500 min-w-[4px]" 
                          style={{ width: `${Math.max(clickPct, 2)}%` }}
                        ></div>
                        <span className="text-[9px] font-bold text-brand-black">{item.clicks}</span>
                      </div>
                    )}

                    {/* Confirmation Bar */}
                    {item.confs > 0 && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 rounded-full bg-green-500 transition-all duration-500 min-w-[4px]" 
                          style={{ width: `${Math.max(confPct, 2)}%` }}
                        ></div>
                        <span className="text-[9px] font-bold text-brand-black">{item.confs}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboards & Activity Feed Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Column 1: Counter Leaderboard */}
        <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-brand-orange" /> Counter Scores
          </h3>
          
          <div className="space-y-3.5">
            {counterLeaderboard.map((item: any, idx: number) => (
              <div 
                key={item.counterId} 
                className="flex items-center justify-between p-3 bg-brand-gray-light/45 rounded-xl border border-brand-gray-mid/60 hover:bg-brand-gray-light transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-orange-dark bg-brand-orange-light w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-brand-black truncate block">{item.counterName}</span>
                  </div>
                  <span className="text-[10px] text-brand-gray-dark font-semibold mt-1 block pl-7">Staff: {item.employeeName}</span>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-brand-black block">{item.score} pts</span>
                  <span className="text-[9px] font-semibold text-brand-gray-dark block mt-0.5">{item.scans} scans • {item.confs} confs</span>
                </div>
              </div>
            ))}
            
            {counterLeaderboard.length === 0 && (
              <p className="text-xs text-brand-gray-dark text-center py-4">No counters configured</p>
            )}
          </div>
        </div>

        {/* Column 2: Employee Leaderboard with Targets */}
        <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-brand-orange" /> Employee Standings
          </h3>
          
          <div className="space-y-4">
            {employeeLeaderboard.map((item: any, idx: number) => (
              <div key={item.employeeId} className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-black">{idx + 1}. {item.employeeName}</span>
                      {!item.active && (
                        <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.25 rounded-md">Inactive</span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-brand-gray-dark">Score: {item.score} pts ({item.confs} confirmed reviews)</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-brand-orange-dark">{item.progress}% of Target</span>
                </div>

                {/* Target Progress Bar */}
                <div className="w-full bg-brand-gray-light h-2.5 rounded-full overflow-hidden border border-brand-gray-mid/60 relative">
                  <div 
                    className="h-full bg-brand-orange transition-all duration-500 rounded-full" 
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-brand-gray-dark tracking-wider">
                  <span>0 REVIEWS</span>
                  <span>TARGET: {item.target}</span>
                </div>
              </div>
            ))}

            {employeeLeaderboard.length === 0 && (
              <p className="text-xs text-brand-gray-dark text-center py-4">No employees registered</p>
            )}
          </div>
        </div>

        {/* Column 3: Recent Activity Logs */}
        <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-4 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-brand-orange" /> Live Activity Feed
          </h3>
          
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {activities.map((act: any) => {
              let typeBg = 'bg-brand-orange-light text-brand-orange-dark';
              if (act.type === 'click') typeBg = 'bg-blue-50 text-blue-600 border border-blue-100';
              if (act.type === 'confirmation') typeBg = 'bg-green-50 text-green-600 border border-green-100';

              return (
                <div key={act.id} className="flex gap-2.5 p-2 bg-brand-gray-light/35 rounded-lg border border-brand-gray-mid/40">
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                    act.type === 'scan' ? 'bg-brand-orange' : act.type === 'click' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-brand-black leading-tight">{act.detail}</p>
                    <p className="text-[9px] font-semibold text-brand-gray-dark mt-1">
                      Counter: {act.counterName} • Staff: {act.employeeName}
                    </p>
                  </div>
                  
                  <span className="text-[8px] font-bold text-brand-gray-dark shrink-0">
                    {new Date(act.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {activities.length === 0 && (
              <p className="text-xs text-brand-gray-dark text-center py-4">No recent activity logged</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
