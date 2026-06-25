'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert,
  Star
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('fb_session');
    if (!sessionStr) {
      router.push('/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      if (session.role !== 'admin') {
        router.push('/login');
      } else {
        setAuthorized(true);
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

  if (!authorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-brand-gray-light">
        <div className="flex flex-col items-center gap-3 animate-pulse-soft">
          <div className="w-12 h-12 rounded-xl bg-brand-orange text-brand-black flex items-center justify-center font-bold text-2xl">
            FB
          </div>
          <p className="text-sm font-semibold text-brand-gray-dark">Authenticating session...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Counters', path: '/admin/counters', icon: QrCode },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-brand-gray-light">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden bg-brand-black text-white py-4 px-6 flex justify-between items-center shadow-md border-b-2 border-brand-orange shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center font-bold text-base text-brand-black">
            FB
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-wider leading-none">FINE BEARING</h1>
            <p className="text-[9px] text-brand-gray-dark tracking-widest leading-none mt-0.5">REVIEW TRACKER</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-brand-orange focus:outline-none p-1 rounded"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-brand-black text-white p-6 shadow-2xl border-r border-brand-orange/20 animate-in slide-in-from-left duration-250">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-brand-orange text-brand-black flex items-center justify-center font-bold text-lg">
                  FB
                </div>
                <span className="font-display font-bold text-sm tracking-wider">FINE BEARING</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-brand-gray-dark hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active 
                        ? 'bg-brand-orange text-brand-black shadow-md' 
                        : 'text-brand-gray-dark hover:bg-brand-dark hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-brand-dark space-y-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-dark rounded-xl border border-brand-orange/10">
                <ShieldAlert className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-semibold text-brand-gray-dark truncate">Administrator</span>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-black text-white p-6 shrink-0 border-r-4 border-brand-orange shadow-xl relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 mt-2">
          <div className="w-10 h-10 rounded-lg bg-brand-orange flex items-center justify-center font-bold text-xl text-brand-black shadow-md">
            FB
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base tracking-wider leading-none">FINE BEARING</h1>
            <p className="text-[10px] text-brand-gray-dark tracking-widest mt-1">REVIEW TRACKER</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                  active 
                    ? 'bg-brand-orange text-brand-black shadow-md font-bold' 
                    : 'text-brand-gray-dark hover:bg-brand-dark hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
                {active && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-black"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile and Sign Out */}
        <div className="pt-6 border-t border-brand-dark space-y-4">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-dark rounded-xl border border-brand-orange/10">
            <ShieldAlert className="w-4 h-4 text-brand-orange shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">Administrator</p>
              <p className="text-[9px] text-brand-gray-dark truncate">admin@finebearing.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
