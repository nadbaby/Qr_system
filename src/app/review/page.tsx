'use strict';

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, Counter } from '@/lib/db';
import { 
  Star, 
  MessageSquare, 
  CheckCircle, 
  MapPin, 
  ThumbsUp, 
  AlertCircle,
  ChevronRight,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';

function ReviewContent() {
  const searchParams = useSearchParams();
  const counterId = searchParams.get('counter') || '';

  const [counter, setCounter] = useState<Counter | null>(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [clickedReview, setClickedReview] = useState(false);
  const [confirmedSubmission, setConfirmedSubmission] = useState(false);
  const [submittingConf, setSubmittingConf] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      if (!counterId) {
        setError('Missing counter parameter in link. Please scan a valid QR code.');
        setLoading(false);
        return;
      }

      try {
        // Fetch counters and config
        const countersList = await db.getCounters();
        const activeCtr = countersList.find(c => c.id === counterId);
        
        if (!activeCtr) {
          setError('Invalid counter ID. Please scan a valid QR code.');
          setLoading(false);
          return;
        }

        if (!activeCtr.active) {
          setError('This counter feedback channel is currently offline.');
          setLoading(false);
          return;
        }

        setCounter(activeCtr);

        // Fetch redirection link
        const url = await db.getGoogleReviewUrl();
        setGoogleUrl(url);

        // Record scan session
        const sId = await db.recordScan(activeCtr.id, activeCtr.employee_id);
        setSessionId(sId);

      } catch (err) {
        console.error('Error logging scan:', err);
        setError('Failed to contact server. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [counterId]);

  const handleWriteReviewClick = () => {
    if (!counter || !googleUrl) return;
    
    setClickedReview(true);
    
    // Open the Google Review page synchronously to prevent browser pop-up blockers from intercepting it
    window.open(googleUrl, '_blank', 'noopener,noreferrer');

    // Record click event asynchronously in the background
    db.recordClick(sessionId, counter.id, counter.employee_id).catch(e => {
      console.error('Error logging click:', e);
    });
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counter || submittingConf) return;

    setSubmittingConf(true);
    try {
      // Record confirmation
      await db.recordConfirmation(
        sessionId,
        counter.id,
        counter.employee_id,
        customerName.trim() || 'Anonymous Customer'
      );

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6600', '#111111', '#8E8E93', '#FFFFFF']
      });

      setConfirmedSubmission(true);
    } catch (err) {
      console.error('Error confirming review:', err);
      alert('Failed to log review submission. Please try again.');
    } finally {
      setSubmittingConf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-brand-gray-light">
        <div className="w-16 h-16 rounded-2xl bg-brand-black text-brand-orange flex items-center justify-center font-bold text-3xl mb-4 shadow animate-pulse-soft">
          FB
        </div>
        <p className="text-sm font-semibold text-brand-gray-dark">Setting up your secure review channel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-brand-gray-light max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-2xl border border-brand-gray-mid shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-brand-black mb-2">Scan Issue</h3>
          <p className="text-xs text-brand-gray-dark leading-relaxed mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-brand-black hover:bg-brand-dark text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors"
          >
            Go to Portal Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-brand-gray-light min-h-screen">
      
      {/* Landing Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-brand-gray-mid shadow-xl overflow-hidden relative">
        
        {/* Top Header Logo */}
        <div className="bg-brand-black py-6 px-8 text-center border-b-4 border-brand-orange relative flex flex-col items-center">
          <div className="w-11 h-11 rounded-xl bg-brand-orange text-brand-black flex items-center justify-center font-bold text-xl shadow-md mb-2">
            FB
          </div>
          <h1 className="text-white font-display font-extrabold text-base tracking-wider leading-none">FINE BEARING</h1>
          <p className="text-[9px] text-brand-gray-dark tracking-widest mt-1 uppercase">&amp; Oil Seal Store</p>
        </div>

        {/* Dynamic Counter Indicator */}
        {counter && (
          <div className="bg-brand-orange-light/45 px-4 py-2 text-center border-b border-brand-gray-mid flex items-center justify-center gap-1.5 text-[10px] font-bold text-brand-orange-dark">
            <MapPin className="w-3.5 h-3.5" />
            <span>Counter: {counter.name}</span>
            {counter.employee && (
              <>
                <span className="text-brand-gray-mid">•</span>
                <span>Assisting Staff: {counter.employee.name}</span>
              </>
            )}
          </div>
        )}

        {/* Content Box */}
        <div className="p-8">
          
          {!confirmedSubmission ? (
            <div className="space-y-6 text-center">
              
              <div>
                <h2 className="text-2xl font-display font-extrabold text-brand-black tracking-tight leading-snug">
                  How was your experience with us?
                </h2>
                <p className="text-brand-gray-dark text-xs mt-2 leading-relaxed">
                  Your honest feedback helps us serve you better. It takes less than a minute!
                </p>
              </div>

              {/* Step 1: Write Google Review CTA */}
              <div className="space-y-3">
                <button
                  onClick={handleWriteReviewClick}
                  className="w-full bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm group hover:scale-[1.02]"
                >
                  <Star className="w-5 h-5 fill-current" />
                  Write a Google Review
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[10px] text-brand-gray-dark font-medium leading-relaxed">
                  Clicking the button will open our official Google Business page in a new window.
                </p>
              </div>

              {/* Step 2: Self Confirmation (Revealed/Active when they click write review) */}
              {clickedReview && (
                <div className="border-t border-brand-gray-mid/70 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
                  <div className="bg-brand-gray-light/65 p-4 rounded-xl border border-brand-gray-mid/60 text-left">
                    <h4 className="text-xs font-bold text-brand-black flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-brand-orange" /> Confirmed submission
                    </h4>
                    <p className="text-[10px] text-brand-gray-dark mt-1 leading-relaxed">
                      Once you finish submitting your feedback on Google, let us know below!
                    </p>
                  </div>

                  <form onSubmit={handleConfirmSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[9px] font-bold text-brand-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-brand-gray-dark" /> Your Name <span className="text-brand-gray-dark font-semibold lowercase italic">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 border border-brand-gray-mid rounded-xl text-xs focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange bg-brand-gray-light/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingConf}
                      className="w-full bg-brand-black hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl transition-all shadow text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-brand-orange" />
                      {submittingConf ? 'Confirming...' : 'I Have Submitted My Review'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          ) : (
            /* Thank You Card */
            <div className="text-center py-6 space-y-5 animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 border border-green-150 flex items-center justify-center mx-auto shadow">
                <ThumbsUp className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-brand-black tracking-tight leading-snug">
                  Thank You so Much!
                </h2>
                <p className="text-brand-gray-dark text-xs mt-2 leading-relaxed px-2">
                  Your feedback helps others make informed choices and encourages our staff members to deliver exceptional service.
                </p>
              </div>

              <div className="border-t border-brand-gray-light pt-6 text-[10px] font-semibold text-brand-orange-dark">
                Fine Bearing &amp; Oil Seal Store • Feedback Saved
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Outer page boundary providing necessary suspense context
export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-brand-gray-light min-h-screen">
        <div className="w-16 h-16 rounded-2xl bg-brand-black text-brand-orange flex items-center justify-center font-bold text-3xl mb-4 shadow animate-pulse-soft">
          FB
        </div>
        <p className="text-sm font-semibold text-brand-gray-dark">Loading review page...</p>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
