'use strict';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../lib/db';
import { Lock, Mail, Key, Shield, User, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<'admin' | 'employee'>('admin');
  
  // Admin fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Employee fields
  const [passcode, setPasscode] = useState('');
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const sessionStr = localStorage.getItem('fb_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (session.role === 'employee') {
          router.push('/employee/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('fb_session');
      }
    }
  }, [router]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await db.adminLogin(email, password);
      if (user) {
        localStorage.setItem('fb_session', JSON.stringify(user));
        router.push('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. (Try: admin@finebearing.com / admin123)');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter your passcode');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await db.employeeLogin(passcode);
      if (user) {
        localStorage.setItem('fb_session', JSON.stringify(user));
        router.push('/employee/dashboard');
      } else {
        setError('Invalid employee passcode. (Try Amit: 1001, Priya: 1002, etc.)');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 bg-brand-gray-light min-h-screen">
      <Link 
        href="/" 
        className="mb-8 inline-flex items-center gap-2 text-sm text-brand-gray-dark hover:text-brand-orange transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to portal home
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-gray-mid shadow-lg overflow-hidden">
        {/* Brand Header */}
        <div className="bg-brand-black p-8 text-center border-b-4 border-brand-orange relative">
          <div className="w-12 h-12 rounded-xl bg-brand-orange text-brand-black flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-md">
            FB
          </div>
          <h2 className="text-white font-display font-bold text-xl tracking-wide">Fine Bearing Review Tracker</h2>
          <p className="text-brand-gray-dark text-xs uppercase tracking-wider mt-1">Staff Access Portal</p>
        </div>

        {/* Form Container */}
        <div className="p-8">
          {/* Tab Selector */}
          <div className="flex bg-brand-gray-light p-1 rounded-xl mb-6">
            <button
              onClick={() => { setTab('admin'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === 'admin' 
                  ? 'bg-white text-brand-orange shadow-sm border border-brand-gray-mid' 
                  : 'text-brand-gray-dark hover:text-brand-black'
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
            <button
              onClick={() => { setTab('employee'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === 'employee' 
                  ? 'bg-white text-brand-orange shadow-sm border border-brand-gray-mid' 
                  : 'text-brand-gray-dark hover:text-brand-black'
              }`}
            >
              <User className="w-4 h-4" /> Employee
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-150 flex items-start gap-2.5 animate-pulse-soft">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin Form */}
          {tab === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-black uppercase tracking-wider mb-2">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-brand-gray-dark" />
                  <input
                    type="email"
                    placeholder="admin@finebearing.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-brand-gray-mid rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange-light bg-brand-gray-light/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-black uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-brand-gray-dark" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-brand-gray-mid rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange-light bg-brand-gray-light/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign In as Admin'}
              </button>
            </form>
          ) : (
            /* Employee Form */
            <form onSubmit={handleEmployeeSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-black uppercase tracking-wider mb-2">Passcode (4-digit PIN)</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-brand-gray-dark" />
                  <input
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Enter 4-digit PIN"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-brand-gray-mid rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange-light bg-brand-gray-light/30 tracking-widest transition-all"
                  />
                </div>
                <p className="text-[11px] text-brand-gray-dark mt-2 leading-relaxed">
                  Enter your unique staff pin assigned by the administrator. Contact your manager if you don&apos;t have one.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-black hover:bg-brand-dark text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to My Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
