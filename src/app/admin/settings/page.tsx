'use strict';

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { 
  Settings, 
  Save, 
  Globe, 
  Check, 
  Info,
  AlertCircle
} from 'lucide-react';

export default function AdminSettings() {
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const url = await db.getGoogleReviewUrl();
        setGoogleReviewUrl(url);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    if (!googleReviewUrl.trim().startsWith('http://') && !googleReviewUrl.trim().startsWith('https://')) {
      setError('Please provide a valid web URL starting with http:// or https://');
      setSaving(false);
      return;
    }

    try {
      await db.updateSetting('GOOGLE_REVIEW_URL', googleReviewUrl.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings in database');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm font-semibold text-brand-gray-dark animate-pulse-soft">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Title Bar */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-brand-black tracking-tight">
          System Settings
        </h2>
        <p className="text-brand-gray-dark text-xs mt-1">
          Configure global review link redirects and external integrations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-brand-gray-mid shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-brand-black text-white p-5 border-b-2 border-brand-orange flex items-center gap-3">
          <Settings className="w-5 h-5 text-brand-orange" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider">Configure Redirect Links</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saved && (
            <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg border border-green-150 flex items-center gap-2 font-semibold">
              <Check className="w-4.5 h-4.5 shrink-0" />
              <span>Settings saved successfully! Redirect URL updated.</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-brand-black uppercase tracking-wider">
              GOOGLE_REVIEW_URL (Redirect Destination)
            </label>
            
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-5 h-5 text-brand-gray-dark" />
              <input
                type="text"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full pl-11 pr-4 py-3 border border-brand-gray-mid rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange bg-brand-gray-light/35"
                required
              />
            </div>

            <div className="bg-brand-gray-light/50 p-3 rounded-xl border border-brand-gray-mid/60 flex items-start gap-2.5 mt-2">
              <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-brand-gray-dark leading-relaxed">
                This link will be loaded in a new tab when a customer scans a counter QR code and clicks <strong className="text-brand-black">&ldquo;Write a Google Review&rdquo;</strong>.
                Make sure you use your specific Google Maps Place ID write-review shortcut.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-gray-light">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-orange hover:bg-brand-orange-dark text-brand-black font-semibold px-5 py-3 rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving changes...' : 'Save Configuration'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
