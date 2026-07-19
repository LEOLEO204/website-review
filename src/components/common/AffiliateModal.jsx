import React from 'react';

export default function AffiliateModal({ show, onClose, merchant, buyUrl }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition">
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
        <h4 className="font-serif font-bold text-xl text-gray-900 mb-2">Redirecting via Affiliate Link...</h4>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed font-sans">
          You are being redirected to <strong>{merchant}</strong> to view the product listing.
        </p>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded text-xs text-orange-800 leading-relaxed font-sans mb-6">
          <strong>How this works:</strong> ReviewSmart is funded by readers. When you purchase through our links, we may earn a small referral commission at no additional cost to you. This commission pays for our independent editorial reviews.
        </div>
        <div className="flex space-x-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 transition uppercase tracking-wider"
          >
            Close Window
          </button>
          <a 
            href={buyUrl || 'https://www.google.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="px-5 py-2 bg-reviewsmart-brand text-white rounded text-xs font-semibold hover:bg-reviewsmart-brandHover transition uppercase tracking-wider"
          >
            Proceed to Merchant
          </a>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
