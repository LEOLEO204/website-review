import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../db';

export default function Footer() {
  const [emailInput, setEmailInput] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const basePath = isAdmin ? '/admin' : '';

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      db.addNewsletterSignup(emailInput);
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setEmailInput('');
      }, 5000);
    }
  };

  return (
    <div className="mt-auto">
      {/* Global Footer */}
      <footer className="bg-[#1c1c1c] border-t border-[#2d2d2d] py-14 px-6 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
            {/* Left section: Branding */}
            <div className="col-span-1 md:col-span-3">
              <div className="border-b border-[#3b3b3b] pb-1.5 mb-3 max-w-[200px]">
                <span className="font-serif italic text-[11px] text-gray-400 tracking-wider">The ReviewSmart Team</span>
              </div>
              <h4 className="font-serif font-black text-3xl tracking-tight text-white mb-4">ReviewSmart</h4>
              
              <p className="text-xs text-gray-300 leading-relaxed font-serif max-w-[480px]">
                ReviewSmart is the product recommendation service from The ReviewSmart Team. Our journalists combine independent research with (occasionally) over-the-top testing so you can make quick and confident buying decisions. Whether it's finding great products or discovering helpful advice, we'll help you get it right (the first time). <Link to={`${basePath}/contact`} className="underline cursor-pointer hover:text-white">Contact us</Link> for questions.
              </p>
            </div>

            {/* Right section: Links (2 Columns) */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
              <div>
                <ul className="space-y-2.5 text-gray-300 font-serif text-[13px] tracking-wide mt-2">
                  <li><Link to={`${basePath}/about`} className="hover:text-white hover:underline">About ReviewSmart</Link></li>
                  <li><Link to={`${basePath}/our-team`} className="hover:text-white hover:underline">Our team</Link></li>
                  <li><Link to={`${basePath}/staff-demographics`} className="hover:text-white hover:underline">Staff demographics</Link></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <ul className="space-y-2.5 text-gray-300 font-serif text-[13px] tracking-wide mt-2">
                  <li><Link to={`${basePath}/how-to-pitch`} className="hover:text-white hover:underline">How to pitch</Link></li>
                  <li><Link to={`${basePath}/contact`} className="hover:text-white hover:underline">Contact The ReviewSmart Team</Link></li>
                  <li><Link to={`${basePath}/contact`} className="hover:text-white hover:underline">Send us feedback</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Fine Print */}
          <div className="border-t border-[#2d2d2d] pt-6 flex flex-col md:flex-row items-center justify-between text-gray-400 text-[10px] gap-4">
            <p>© 2026 ReviewSmart, Inc., A ReviewSmart Team Company</p>
            <div className="flex flex-wrap gap-4 text-gray-400 font-sans justify-center">
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">Privacy Policy</Link>
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">Terms of Service</Link>
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">Cookie Policy</Link>
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">Partnerships & Advertising</Link>
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">Licensing & Reprints</Link>
              <Link to={`${basePath}/about`} className="hover:text-white hover:underline">RSS</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
