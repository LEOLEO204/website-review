import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../../db';
import { uncloakUrl } from '../../utils/security';

const highlightText = (text, query) => {
  return text;
};

// Helper to get matching beautiful image for a category

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('/') || 
         trimmed.startsWith('data:image/');
};

const getArticleImage = (art) => {
  return "";
};

// ----------------------------------------------------
// PAGE: HOMEPAGE COMPONENT
// ----------------------------------------------------

export default function ReviewPage({ triggerAffiliate, searchQuery }) {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState('review-body');
  const [showCompare, setShowCompare] = useState(true);

  useEffect(() => {
    const art = db.getArticle(slug);
    if (art) {
      setArticle(art);
      const allProds = db.getProductsForArticle(art.id, art.title, art.categoryId);
      setProducts(allProds);
    }
  }, [slug]);

  if (!article) {
    return <div className="text-center py-20 font-serif text-gray-600">Review article not found.</div>;
  }

  const sections = [
    { id: 'review-body', label: 'Article Editorial' },
    { id: 'picks', label: 'Recommended Picks' },
    { id: 'compare-matrix', label: 'Comparison Matrix' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Breadcrumb */}
      <nav className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">
        <ol className="flex items-center space-x-2">
          <li><Link to="/" className="hover:text-gray-600">Home</Link></li>
          <li><span>/</span></li>
          <li><span className="text-gray-400 select-none font-semibold">Reviews</span></li>
          <li><span>/</span></li>
          <li className="text-gray-600 truncate max-w-xs">{article.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="mb-10 max-w-4xl">
        <h1 className="text-4xl sm:text-5xl font-serif font-black leading-tight tracking-tight text-gray-900 mb-4">
          {highlightText(article.title, searchQuery)}
        </h1>
        <p className="text-xl text-gray-600 font-serif leading-relaxed mb-6">
          {highlightText(article.intro, searchQuery)}
        </p>

        <div className="flex flex-wrap items-center justify-between border-y border-reviewsmart-border py-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 uppercase">
              {article.author.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">By {article.author}</p>
              <p className="text-xs text-reviewsmart-muted">{article.authorRole}</p>
            </div>
          </div>
          <div className="text-right text-xs text-reviewsmart-muted">
            <p>Updated {article.updatedAt}</p>
            {article.verifiedPick && (
              <p className="font-semibold text-reviewsmart-brand mt-0.5">Verified Pick & Live Prices</p>
            )}
          </div>
        </div>
      </div>

      {/* Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar TOC */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 bg-reviewsmart-bgLight border border-reviewsmart-border rounded p-4 shadow-sm">
            <h2 className="text-sm font-sans font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 mb-3">
              Table of Contents
            </h2>
            <ul className="space-y-2.5 text-sm font-medium">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={`block leading-snug py-1 border-l-2 pl-3 transition-colors ${
                      activeSection === sec.id
                        ? 'border-reviewsmart-brand text-reviewsmart-brand font-bold bg-[#da372306]'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(sec.id);
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        setActiveSection(sec.id);
                      }
                    }}
                  >
                    {sec.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Article content */}
        <main className="lg:col-span-3 space-y-12">
          
          {/* Quick Summary list of picks */}
          <section className="bg-reviewsmart-bgLight border border-reviewsmart-border rounded-lg p-6">
            <h3 className="font-sans font-extrabold uppercase tracking-wide text-xs text-gray-500 mb-4">
              Picks Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold text-white px-2 py-0.5 rounded ${prod.badgeColor || 'bg-reviewsmart-brand'}`}>
                        {prod.badge}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{prod.price}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-gray-900 mb-1 hover:text-reviewsmart-brand transition cursor-pointer" onClick={() => document.getElementById(`prod-${prod.id}`).scrollIntoView({ behavior: 'smooth' })}>
                      {prod.name}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-3 mb-4">
                      {prod.shortDescription}
                    </p>
                  </div>
                  {prod.affiliateLinks && prod.affiliateLinks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {prod.affiliateLinks.map((linkObj, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => triggerAffiliate(linkObj.retailer, uncloakUrl(linkObj.link), e)}
                          className="bg-reviewsmart-brand text-white font-semibold py-1.5 px-2 rounded text-[10px] hover:bg-reviewsmart-brandHover transition tracking-wider uppercase truncate"
                          title={`Buy from ${linkObj.retailer}`}
                        >
                          {linkObj.retailer}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => triggerAffiliate(prod.merchant, uncloakUrl(prod.buyUrl), e)}
                      className="w-full bg-reviewsmart-brand text-white font-semibold py-2 rounded text-xs hover:bg-reviewsmart-brandHover transition tracking-wider uppercase"
                    >
                      Buy from {prod.merchant}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* HTML Editorial content from DB */}
          <section 
            id="review-body" 
            className="scroll-mt-32 border-b border-gray-200 pb-10 font-serif text-gray-700 leading-relaxed space-y-4 text-base"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* DYNAMIC PRODUCT REVIEW CARDS */}
          <section id="picks" className="scroll-mt-32 space-y-12">
            <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 border-b border-gray-200 pb-3">
              Our Recommended Products
            </h2>
            {products.map(prod => (
              <div key={prod.id} id={`prod-${prod.id}`} className="scroll-mt-32 border-t-2 border-gray-200 pt-8">
                
                {/* Pick badge */}
                <div className="flex flex-wrap items-baseline gap-2 mb-3">
                  <span className={`${prod.badgeColor || 'bg-reviewsmart-brand'} text-white font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded`}>
                    {prod.badge}
                  </span>
                  <span className="font-sans font-bold text-sm text-reviewsmart-muted uppercase tracking-wider">
                    {prod.tagline}
                  </span>
                </div>

                {/* Card layout */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    {/* Left Image */}
                    <div className="md:col-span-2 bg-[#f9f9f9] flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'} 
                        alt={prod.name} 
                        className="max-h-56 object-contain hover:scale-105 transition duration-300"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'; }}
                      />
                    </div>

                    {/* Right Details */}
                    <div className="md:col-span-3 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between mb-4 border-b border-gray-100 pb-2">
                          <span className="text-xl font-bold text-gray-900">{prod.price}</span>
                          <span className="text-xs text-gray-500 font-medium">from {prod.merchant}</span>
                        </div>
                        <h4 className="text-lg font-serif font-bold text-gray-900 mb-2">
                          {highlightText(prod.name, searchQuery)}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-sans mb-4">
                          {highlightText(prod.shortDescription, searchQuery)}
                        </p>
                        {prod.rating && (
                          <div className="text-xs text-amber-500 font-bold">
                            ★★★★★ <span className="text-gray-500 font-medium font-sans">({prod.rating} rating / {prod.reviewsCount} reviews)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        {prod.affiliateLinks && prod.affiliateLinks.length > 0 ? (
                          <div className="space-y-2">
                            <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Purchase Options:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {prod.affiliateLinks.map((linkObj, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => triggerAffiliate(linkObj.retailer, uncloakUrl(linkObj.link), e)}
                                  className="inline-flex items-center justify-center bg-reviewsmart-brand text-white font-extrabold py-2.5 px-4 rounded text-xs hover:bg-reviewsmart-brandHover transition tracking-wider uppercase"
                                >
                                  Buy from {linkObj.retailer}
                                  <span className="ml-1.5 font-bold">→</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => triggerAffiliate(prod.merchant, uncloakUrl(prod.buyUrl), e)}
                            className="w-full inline-flex items-center justify-center bg-reviewsmart-brand text-white font-extrabold py-3 px-6 rounded text-sm hover:bg-reviewsmart-brandHover transition tracking-wider uppercase"
                          >
                            Buy from {prod.merchant}
                            <span className="ml-2 font-bold">→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pros/Cons lists if they exist */}
                {((prod.pros && prod.pros.length > 0) || (prod.cons && prod.cons.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {prod.pros && prod.pros.length > 0 && (
                      <div className="bg-[#f0faf2] border border-[#d6f5df] rounded-lg p-4">
                        <h5 className="font-bold text-xs uppercase text-[#1b5e20] tracking-wider mb-2 flex items-center">
                          ✔ Pros
                        </h5>
                        <ul className="space-y-1.5 text-xs font-sans text-slate-800">
                          {prod.pros.map((p, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-[#2e7d32] mr-2">•</span>
                              <span>{highlightText(p, searchQuery)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prod.cons && prod.cons.length > 0 && (
                      <div className="bg-[#fff9f9] border border-[#ffeded] rounded-lg p-4">
                        <h5 className="font-bold text-xs uppercase text-[#c62828] tracking-wider mb-2 flex items-center">
                          ✘ Cons
                        </h5>
                        <ul className="space-y-1.5 text-xs font-sans text-slate-800">
                          {prod.cons.map((c, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-[#c62828] mr-2">•</span>
                              <span>{highlightText(c, searchQuery)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* DYNAMIC COMPARISON MATRIX */}
          {products.length > 1 && (
            <section id="compare-matrix" className="scroll-mt-32 border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-serif text-gray-900">Toolkit Comparison Table</h2>
                <button 
                  onClick={() => setShowCompare(!showCompare)}
                  className="text-xs font-bold font-sans text-reviewsmart-brand hover:underline"
                >
                  {showCompare ? 'Collapse Matrix' : 'Expand Matrix'}
                </button>
              </div>
              
              {showCompare && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 font-sans text-sm">
                    <thead className="bg-reviewsmart-bgLight text-xs font-extrabold uppercase tracking-wider text-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left">Feature</th>
                        {products.map(p => (
                          <th key={p.id} className="px-6 py-4 text-left font-extrabold">{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                      <tr>
                        <td className="px-6 py-3.5 font-bold">Price</td>
                        {products.map(p => (
                          <td key={p.id} className="px-6 py-3.5 font-extrabold text-reviewsmart-brand">{p.price}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold">Total Pieces</td>
                        {products.map(p => (
                          <td key={p.id} className="px-6 py-3.5">{p.pieces || '1'} Pieces</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold">Case Type</td>
                        {products.map(p => (
                          <td key={p.id} className="px-6 py-3.5">{p.caseType || 'Standard'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-bold">Merchant</td>
                        {products.map(p => (
                          <td key={p.id} className="px-6 py-3.5 font-medium">{p.merchant}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

        </main>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// PAGE: DEALS PAGE COMPONENT
// ----------------------------------------------------
