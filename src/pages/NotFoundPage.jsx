import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, HelpCircle } from 'lucide-react';
import { setSEOHead } from '../utils/seo';

export default function NotFoundPage() {
  useEffect(() => {
    setSEOHead({
      title: '404 - Page Not Found | ReviewSmart',
      description: 'The page you are looking for does not exist or has been moved. Explore our latest reviews and product buying guides.',
      noindex: true,
      canonicalUrl: 'https://review.totsystem.com/404'
    });
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-xl w-full text-center space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xl">
        {/* 404 Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shadow-sm animate-bounce">
          <HelpCircle className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            HTTP Status Code: 404 Not Found
          </span>
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="font-serif text-base text-slate-600 leading-relaxed max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-sm transition shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans font-semibold text-sm transition border border-slate-300"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Consultation / Contact Us</span>
          </Link>
        </div>

        {/* Quick Helper Links */}
        <div className="pt-6 text-xs text-slate-400 font-serif flex items-center justify-center gap-6">
          <Link to="/deals" className="hover:text-slate-700 hover:underline">
            Latest Deals
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-slate-700 hover:underline">
            About ReviewSmart
          </Link>
          <span>•</span>
          <Link to="/our-team" className="hover:text-slate-700 hover:underline">
            Editorial Team
          </Link>
        </div>
      </div>
    </div>
  );
}
