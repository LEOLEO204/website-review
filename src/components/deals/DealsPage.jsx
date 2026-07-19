import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db';

export default function DealsPage({ triggerAffiliate }) {
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');

  useEffect(() => {
    const handleSync = () => {
      setDeals(db.getDeals().filter(d => d.active));
      setCategories(db.getCategories());
    };
    handleSync();
    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, []);

  const filteredDeals = selectedCat === 'all' 
    ? deals 
    : deals.filter(d => d.categoryId === selectedCat);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      
      {/* Deals Header */}
      <div className="border-b border-reviewsmart-border pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-reviewsmart-brand uppercase">
            Vetted Bargains
          </span>
          <h1 className="text-4xl font-serif font-black text-gray-900 mt-1">
            ReviewSmart Daily Deals
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-sans">
            Our deals editors track down high-quality picks at low prices. Only products we review and recommend ever make this page.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button 
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2 rounded border ${
              selectedCat === 'all' 
                ? 'bg-gray-800 text-white border-gray-800' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            } transition`}
          >
            All Deals ({deals.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded border ${
                selectedCat === cat.id 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              } transition`}
            >
              {cat.name} ({deals.filter(d => d.categoryId === cat.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Deals feed grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map(deal => (
          <div key={deal.id} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                {deal.discount && deal.discount.toLowerCase().trim() !== 'giảm giá' && deal.discount.toLowerCase().trim() !== 'giam gia' && deal.discount.replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim() !== '' ? (
                  <span className="bg-rose-100 text-rose-800 font-extrabold text-xs px-2.5 py-0.5 rounded">
                    {deal.discount.replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim()}
                  </span>
                ) : <span />}
                {deal.isEditorPick && (
                  <span className="text-xs font-bold text-reviewsmart-accentGreen uppercase tracking-wide">
                    ★ Editor's Pick
                  </span>
                )}
              </div>
              <div className="h-40 bg-gray-50 rounded flex items-center justify-center p-4 mb-4">
                <img 
                  src={deal.imageUrl} 
                  alt={deal.title} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.target.src = '/anvil_tool_set.png'; }}
                />
              </div>
              <h3 className="font-sans font-bold text-base text-gray-900 leading-snug mb-2 line-clamp-2">
                {deal.title}
              </h3>
              <div className="flex items-baseline space-x-2 text-sm mb-4">
                <span className="font-black text-reviewsmart-brand text-lg">{deal.dealPrice}</span>
                <span className="text-gray-400 line-through text-xs">{deal.originalPrice}</span>
                <span className="text-gray-500 font-medium text-xs">at {deal.merchant}</span>
              </div>
            </div>
            <button
              onClick={(e) => triggerAffiliate(deal.merchant, deal.link, e)}
              className="w-full bg-reviewsmart-brand text-white font-extrabold py-2.5 rounded text-xs hover:bg-reviewsmart-brandHover transition tracking-wider uppercase"
            >
              Buy from {deal.merchant}
            </button>
          </div>
        ))}

        {filteredDeals.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 font-serif bg-gray-50 border border-dashed rounded-lg">
            No active deals matching this category. Add new deals via Admin CMS!
          </div>
        )}
      </div>

    </div>
  );
}

// ----------------------------------------------------
// PAGE: ADMIN ADMINISTRATION CONTROL PANEL
// ----------------------------------------------------
