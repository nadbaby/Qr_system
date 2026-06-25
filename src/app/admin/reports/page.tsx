'use strict';

'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  MapPin, 
  User, 
  TrendingUp, 
  QrCode, 
  MousePointerClick, 
  CheckCircle,
  Clock
} from 'lucide-react';

type ReportType = 'daily_counter' | 'weekly_employee' | 'monthly_ranking' | 'audit_log';

export default function AdminReports() {
  const [reportType, setReportType] = useState<ReportType>('daily_counter');
  
  // Date states
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  
  // Loaded Data
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Default date ranges
  useEffect(() => {
    const now = new Date();
    // Default to last 30 days
    const past30 = new Date();
    past30.setDate(now.getDate() - 30);
    
    setStartDateStr(past30.toISOString().split('T')[0]);
    setEndDateStr(now.toISOString().split('T')[0]);
  }, []);

  const loadReportData = useCallback(async () => {
    if (!startDateStr || !endDateStr) return;
    setLoading(true);
    try {
      const s = new Date(startDateStr);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDateStr);
      e.setHours(23, 59, 59, 999);
      
      const data = await db.getAnalytics({ start: s, end: e, custom: true });
      setAnalytics(data);
    } catch (err) {
      console.error('Error generating report data:', err);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    loadReportData();
  };

  // Helper to compile data for download
  const handleDownload = () => {
    if (!analytics) return;

    let csvContent = `Fine Bearing Review Tracker - Report: ${reportType.replace('_', ' ').toUpperCase()}\n`;
    csvContent += `Generated at: ${new Date().toLocaleString()}\n`;
    csvContent += `Period: ${startDateStr} to ${endDateStr}\n\n`;

    if (reportType === 'daily_counter') {
      csvContent += 'Counter Name,Counter ID,Scans,Google Review Clicks,Confirmed Submissions,Conversion Rate,Score (pts)\n';
      analytics.counterLeaderboard.forEach((c: any) => {
        csvContent += `"${c.counterName}","${c.counterId}",${c.scans},${c.clicks},${c.confs},${c.conversionRate}%,${c.score}\n`;
      });
    } else if (reportType === 'weekly_employee') {
      csvContent += 'Employee Name,Email,Scans,Clicks,Confirmations,Conversion Rate,Score,Monthly Target,Target Achievement\n';
      analytics.employeeLeaderboard.forEach((e: any) => {
        csvContent += `"${e.employeeName}","${e.email}",${e.scans},${e.clicks},${e.confs},${e.conversionRate}%,${e.score},${e.target},${e.progress}%\n`;
      });
    } else if (reportType === 'monthly_ranking') {
      csvContent += 'Rank,Employee Name,Score (pts),Scans,Clicks,Confirmations\n';
      analytics.employeeLeaderboard.forEach((e: any, idx: number) => {
        csvContent += `${idx + 1},"${e.employeeName}",${e.score},${e.scans},${e.clicks},${e.confs}\n`;
      });
    } else if (reportType === 'audit_log') {
      csvContent += 'Time,Activity Type,Counter ID,Counter Name,Employee Name,Details\n';
      analytics.activities.forEach((act: any) => {
        csvContent += `"${new Date(act.time).toLocaleString()}","${act.type.toUpperCase()}","${act.counterId}","${act.counterName}","${act.employeeName}","${act.detail}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fb_report_${reportType}_${startDateStr}_to_${endDateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black tracking-tight">
            Review Reports
          </h2>
          <p className="text-brand-gray-dark text-xs mt-1">
            Analyze historical customer reviews, audit staff logs, and download spreadsheet reports.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={loading || !analytics}
          className="bg-brand-black hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-brand-orange" /> Download Spreadsheet
        </button>
      </div>

      {/* Report Configuration Panel */}
      <div className="bg-white rounded-2xl border border-brand-gray-mid p-5 shadow-sm">
        <form onSubmit={handleGenerate} className="grid md:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-2">Report Template</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs bg-white focus:outline-none focus:border-brand-orange font-bold text-brand-black"
            >
              <option value="daily_counter">Daily Counter Performance</option>
              <option value="weekly_employee">Weekly Employee Standings</option>
              <option value="monthly_ranking">Monthly Rankings &amp; Targets</option>
              <option value="audit_log">Detailed Activity Audit Log</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-2">From Date</label>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange font-bold text-brand-black"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider mb-2">To Date</label>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="w-full px-3 py-2 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange font-bold text-brand-black"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Generate Report
            </button>
          </div>

        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-sm font-semibold text-brand-gray-dark animate-pulse-soft">Compiling report data...</p>
        </div>
      ) : (
        /* Report Render Container */
        <div className="bg-white border border-brand-gray-mid rounded-2xl overflow-hidden shadow-sm">
          
          {/* Report Metadata Banner */}
          <div className="bg-brand-gray-light/45 p-4 border-b border-brand-gray-mid flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-gray-dark">
              Showing results for {new Date(startDateStr).toLocaleDateString()} to {new Date(endDateStr).toLocaleDateString()}
            </span>
            <span className="font-bold text-brand-orange-dark uppercase tracking-wider text-[9px] bg-brand-orange-light px-2.5 py-1 rounded-full border border-brand-orange/10">
              {reportType.replace('_', ' ')}
            </span>
          </div>

          {/* Daily Counter Performance Report */}
          {reportType === 'daily_counter' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-black text-white text-[10px] font-bold uppercase tracking-wider border-b border-brand-orange">
                    <th className="py-4 px-5"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Counter Name</div></th>
                    <th className="py-4 px-5 text-center"><div className="flex items-center justify-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-brand-orange" /> QR Scans</div></th>
                    <th className="py-4 px-5 text-center"><div className="flex items-center justify-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5 text-blue-500" /> Clicks</div></th>
                    <th className="py-4 px-5 text-center"><div className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Confirmed</div></th>
                    <th className="py-4 px-5 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-purple-500" /> Conv. Rate</div></th>
                    <th className="py-4 px-5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-mid">
                  {analytics?.counterLeaderboard.map((c: any) => (
                    <tr key={c.counterId} className="hover:bg-brand-gray-light/35 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-brand-black">{c.counterName}</div>
                        <div className="text-[10px] text-brand-gray-dark mt-0.5">ID: {c.counterId} • Staff: {c.employeeName}</div>
                      </td>
                      <td className="py-4 px-5 text-center font-semibold text-brand-black">{c.scans}</td>
                      <td className="py-4 px-5 text-center font-semibold text-brand-black">{c.clicks}</td>
                      <td className="py-4 px-5 text-center font-semibold text-brand-black">{c.confs}</td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">{c.conversionRate}%</span>
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-brand-black">{c.score} pts</td>
                    </tr>
                  ))}
                  {analytics?.counterLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center italic text-brand-gray-dark font-medium">No activity registered for counters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Weekly Employee Performance Report */}
          {reportType === 'weekly_employee' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-black text-white text-[10px] font-bold uppercase tracking-wider border-b border-brand-orange">
                    <th className="py-4 px-5"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Employee Name</div></th>
                    <th className="py-4 px-5 text-center">Scans</th>
                    <th className="py-4 px-5 text-center">Clicks</th>
                    <th className="py-4 px-5 text-center">Confirmed</th>
                    <th className="py-4 px-5 text-center">Conversion</th>
                    <th className="py-4 px-5 text-center">Monthly Target</th>
                    <th className="py-4 px-5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-mid">
                  {analytics?.employeeLeaderboard.map((e: any) => (
                    <tr key={e.employeeId} className="hover:bg-brand-gray-light/35 transition-colors">
                      <td className="py-4 px-5 font-bold text-brand-black">
                        <div>{e.employeeName}</div>
                        <div className="text-[10px] text-brand-gray-dark font-semibold mt-0.5">{e.email}</div>
                      </td>
                      <td className="py-4 px-5 text-center font-semibold">{e.scans}</td>
                      <td className="py-4 px-5 text-center font-semibold">{e.clicks}</td>
                      <td className="py-4 px-5 text-center font-semibold">{e.confs}</td>
                      <td className="py-4 px-5 text-center font-bold text-brand-black">{e.conversionRate}%</td>
                      <td className="py-4 px-5 text-center font-bold text-brand-gray-dark">
                        {e.confs} / {e.target} <span className="text-[10px] text-brand-orange-dark bg-brand-orange-light px-1.5 py-0.5 rounded-full ml-1 font-extrabold">{e.progress}%</span>
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-brand-black">{e.score} pts</td>
                    </tr>
                  ))}
                  {analytics?.employeeLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center italic text-brand-gray-dark font-medium">No employee records in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Monthly Ranking Report */}
          {reportType === 'monthly_ranking' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-black text-white text-[10px] font-bold uppercase tracking-wider border-b border-brand-orange">
                    <th className="py-4 px-5 w-20 text-center">Rank</th>
                    <th className="py-4 px-5"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Employee Name</div></th>
                    <th className="py-4 px-5 text-center">Scans</th>
                    <th className="py-4 px-5 text-center">Clicks</th>
                    <th className="py-4 px-5 text-center">Confirmed Reviews</th>
                    <th className="py-4 px-5 text-right">Scoring Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-mid">
                  {analytics?.employeeLeaderboard.map((e: any, idx: number) => (
                    <tr key={e.employeeId} className="hover:bg-brand-gray-light/35 transition-colors">
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-extrabold ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : idx === 1 
                            ? 'bg-zinc-200 text-zinc-800' 
                            : idx === 2 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-brand-gray-light text-brand-gray-dark border border-brand-gray-mid/60'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-extrabold text-brand-black">{e.employeeName}</td>
                      <td className="py-4 px-5 text-center font-medium text-brand-gray-dark">{e.scans}</td>
                      <td className="py-4 px-5 text-center font-medium text-brand-gray-dark">{e.clicks}</td>
                      <td className="py-4 px-5 text-center font-bold text-green-600 bg-green-50/20">{e.confs}</td>
                      <td className="py-4 px-5 text-right font-extrabold text-brand-orange-dark">{e.score} pts</td>
                    </tr>
                  ))}
                  {analytics?.employeeLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center italic text-brand-gray-dark font-medium">No scores registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Log Report */}
          {reportType === 'audit_log' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-black text-white text-[10px] font-bold uppercase tracking-wider border-b border-brand-orange">
                    <th className="py-4 px-5 w-48"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Date &amp; Time</div></th>
                    <th className="py-4 px-5 w-32">Event Type</th>
                    <th className="py-4 px-5">Counter Location</th>
                    <th className="py-4 px-5">Sales Employee</th>
                    <th className="py-4 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-mid">
                  {analytics?.activities.map((act: any) => (
                    <tr key={act.id} className="hover:bg-brand-gray-light/35 transition-colors">
                      <td className="py-4 px-5 font-mono text-brand-gray-dark">
                        {new Date(act.time).toLocaleString()}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          act.type === 'scan' 
                            ? 'bg-brand-orange-light text-brand-orange-dark border border-brand-orange/15' 
                            : act.type === 'click' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-green-50 text-green-700 border border-green-150'
                        }`}>
                          {act.type}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-brand-black">{act.counterName}</td>
                      <td className="py-4 px-5 font-medium text-brand-black">{act.employeeName}</td>
                      <td className="py-4 px-5 text-brand-gray-dark font-medium">{act.detail}</td>
                    </tr>
                  ))}
                  {analytics?.activities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center italic text-brand-gray-dark font-medium">No activity logged in audit feed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
