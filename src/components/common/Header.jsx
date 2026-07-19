import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Mail } from 'lucide-react';
import SearchWidget from './SearchWidget';
import MegaMenu from './MegaMenu';

export default function Header({ searchQuery, setSearchQuery, isAdminActive }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <header className="bg-white border-b border-reviewsmart-border sticky top-0 z-50 transition-all duration-200 select-none">
      
      {/* Top Row: Brand & Search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand logo & tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            to={isAdminPath ? "/admin" : "/"} 
            onClick={() => {
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const scrollableContainer = document.querySelector('.overflow-y-auto');
              if (scrollableContainer) {
                scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="font-serif font-black text-2xl tracking-tighter text-gray-900 flex items-center gap-1.5 hover:opacity-90 transition"
          >
            <div className="h-7 w-7 rounded bg-[#da3723] flex items-center justify-center font-bold text-white text-sm">
              RS
            </div>
            <span>ReviewSmart</span>
          </Link>
          <span className="hidden md:inline-block border-l border-gray-200 pl-3 text-[10px] text-gray-400 font-sans font-bold tracking-widest uppercase">
            Your Vetted Shopping Guide
          </span>
        </div>

        {/* Global search */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-4 sm:mx-8">
          <SearchWidget searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>

        <div className="flex items-center space-x-3 shrink-0">
        </div>
      </div>

      {/* Bottom Row: Dynamic Category Links with Mega Menu */}
      <MegaMenu />
    </header>
  );
}
