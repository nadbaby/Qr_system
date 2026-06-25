import Link from 'next/link';
import { ArrowRight, Star, Settings, Users, LayoutDashboard, QrCode } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Navbar */}
      <header className="bg-brand-black text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-lg border-b-4 border-brand-orange">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-orange flex items-center justify-center font-bold text-xl text-brand-black">
            FB
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-wider">FINE BEARING</h1>
            <p className="text-xs text-brand-gray-dark tracking-widest">&amp; OIL SEAL STORE</p>
          </div>
        </div>
        <Link 
          href="/login" 
          className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold px-5 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm shadow-md"
        >
          Staff Login <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-orange-light text-brand-orange-dark px-4 py-1.5 rounded-full text-sm font-semibold mb-4 shadow-sm">
            <Star className="w-4 h-4 fill-current animate-pulse-soft" />
            Smart Review Generation System
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-black tracking-tight mb-4">
            Fine Bearing <span className="text-brand-orange">Review Tracker</span>
          </h2>
          <p className="text-brand-gray-dark max-w-2xl mx-auto text-base md:text-lg">
            Empower your sales counters with custom QR codes, reward top-performing employees, and boost honest customer reviews on Google.
          </p>
        </div>

        {/* Portal Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          {/* Card 1: Staff Portal */}
          <div className="bg-white rounded-2xl p-8 border border-brand-gray-mid shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-black text-brand-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-brand-black mb-3">Management & Staff Portal</h3>
              <p className="text-brand-gray-dark text-sm mb-6 leading-relaxed">
                Log in as an Admin to configure counters, manage staff, assign targets, and generate print-ready QR cards. Staff can log in using their secure passcode to view their personal performance leaderboard and monthly targets.
              </p>
            </div>
            <Link 
              href="/login" 
              className="bg-brand-black hover:bg-brand-dark text-white font-semibold w-full text-center py-3.5 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-sm"
            >
              Access Dashboard <ArrowRight className="w-4 h-4 text-brand-orange" />
            </Link>
          </div>

          {/* Card 2: Customer Landing Page Demo */}
          <div className="bg-white rounded-2xl p-8 border border-brand-gray-mid shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-orange text-brand-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-brand-black mb-3">Customer Review Landing Page</h3>
              <p className="text-brand-gray-dark text-sm mb-6 leading-relaxed">
                Scan-simulators to preview the customer review flow. Selecting a counter below will record a QR scan, show the customized feedback screen, and track clicks/confirmations back to the database.
              </p>
              
              {/* Quick simulator links */}
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold text-brand-gray-dark uppercase tracking-wider block">Select a counter to test:</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/review?counter=counter-1" 
                    className="text-xs bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark font-medium p-2.5 rounded-lg border border-brand-gray-mid text-center transition-all"
                  >
                    Billing Counter (Amit)
                  </Link>
                  <Link 
                    href="/review?counter=counter-2" 
                    className="text-xs bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark font-medium p-2.5 rounded-lg border border-brand-gray-mid text-center transition-all"
                  >
                    Oil Seals (Priya)
                  </Link>
                  <Link 
                    href="/review?counter=counter-3" 
                    className="text-xs bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark font-medium p-2.5 rounded-lg border border-brand-gray-mid text-center transition-all"
                  >
                    Ball Bearings (Rahul)
                  </Link>
                  <Link 
                    href="/review?counter=counter-4" 
                    className="text-xs bg-brand-gray-light hover:bg-brand-orange-light hover:text-brand-orange-dark font-medium p-2.5 rounded-lg border border-brand-gray-mid text-center transition-all"
                  >
                    Heavy Bearings (Vikram)
                  </Link>
                </div>
              </div>
            </div>
            <Link 
              href="/review?counter=counter-1" 
              className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold w-full text-center py-3.5 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-sm"
            >
              Launch Simulator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Brand highlights */}
        <div className="mt-16 border-t border-brand-gray-mid pt-8 w-full grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-display font-extrabold text-brand-orange">1 Point</div>
            <div className="text-xs font-semibold text-brand-gray-dark uppercase mt-1">QR Code Scan</div>
          </div>
          <div>
            <div className="text-2xl font-display font-extrabold text-brand-orange">2 Points</div>
            <div className="text-xs font-semibold text-brand-gray-dark uppercase mt-1">Google Click</div>
          </div>
          <div>
            <div className="text-2xl font-display font-extrabold text-brand-orange">5 Points</div>
            <div className="text-xs font-semibold text-brand-gray-dark uppercase mt-1">Self-Confirmed Review</div>
          </div>
          <div>
            <div className="text-2xl font-display font-extrabold text-brand-orange">100%</div>
            <div className="text-xs font-semibold text-brand-gray-dark uppercase mt-1">Mobile Optimized</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-black text-brand-gray-dark py-6 text-center text-xs border-t border-brand-dark">
        <p>&copy; {new Date().getFullYear()} Fine Bearing &amp; Oil Seal Store. All Rights Reserved.</p>
        <p className="mt-1 text-brand-orange font-medium">Fine Bearing Review Tracker v1.0</p>
      </footer>
    </div>
  );
}
