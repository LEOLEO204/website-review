import React, { useContext } from 'react';
import { ArticleContext } from '../../context/ArticleContext';
import { ProductContext } from '../../context/ProductContext';
import { 
  TrendingUp, 
  FileText, 
  Database, 
  MousePointer, 
  CheckSquare, 
  DollarSign, 
  PlusCircle, 
  ChevronRight 
} from 'lucide-react';

export default function AdminDashboard({ setActiveTab, setEditingArticleId }) {
  const { articles } = useContext(ArticleContext);
  const { products } = useContext(ProductContext);

  // Compute stats
  const totalArticles = articles.length;
  const totalProducts = products.length;
  const totalClicks = articles.reduce((sum, art) => sum + (art.clicks || 0), 0);
  
  // Simulate affiliate analytics metrics
  const conversionRate = 2.5; // Benchmark rate
  const totalConversions = Math.round(totalClicks * (conversionRate / 100));
  const averageCommission = 5.00; // Benchmark average commission per conversion ($)
  const totalEarnings = totalConversions * averageCommission;

  return (
    <div className="space-y-8 text-left font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Overview of ReviewSmart affiliate marketing operations and statistics.</p>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Clicks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Clicks</span>
            <MousePointer size={16} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{totalClicks.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+8.3%</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Direct clicks to affiliated merchants</span>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avg Conversion Rate</span>
            <CheckSquare size={16} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{conversionRate}%</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Stable</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Benchmark calculated from retail analytics</span>
        </div>

        {/* Est Earnings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Est. Earnings</span>
            <DollarSign size={16} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+$85.00</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Estimated commission at $5.00 / sale</span>
        </div>

        {/* Products in DB */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Product Inventory</span>
            <Database size={16} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{totalProducts} Items</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Active</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Independent products in Database</span>
        </div>

      </div>

      {/* SVG Growth Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-sm text-slate-950">Click-Through Performance Trends</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Clicks across all affiliate channels captured over the last week.</p>
          </div>
          <span className="text-[10px] text-slate-500 font-bold border border-slate-200 rounded px-2.5 py-1">Last 7 Days</span>
        </div>
        
        {/* SVG Path */}
        <div className="h-44 w-full">
          <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#da3723" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#da3723" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="25" x2="700" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
            <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
            <line x1="0" y1="125" x2="700" y2="125" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
            
            <path
              d="M 0,150 L 0,110 L 116,90 L 233,125 L 350,70 L 466,60 L 583,35 L 700,20 L 700,150 Z"
              fill="url(#chartLineGrad)"
            />
            
            <path
              d="M 0,110 L 116,90 L 233,125 L 350,70 L 466,60 L 583,35 L 700,20"
              fill="none"
              stroke="#da3723"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="116" cy="90" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
            <circle cx="233" cy="125" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
            <circle cx="350" cy="70" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
            <circle cx="466" cy="60" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
            <circle cx="583" cy="35" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
            <circle cx="700" cy="20" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 mt-4 px-2 uppercase tracking-wider">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      {/* Split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top conversion content */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Top Vetted Articles</h3>
          <div className="divide-y divide-slate-100">
            {articles.slice(0, 3).map((art, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold text-slate-900 truncate">{art.title}</p>
                  <span className="text-[10px] text-slate-400">{art.category} • Updated {art.date}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-slate-900">{art.clicks || 0} Clicks</p>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">2.5% CR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action options */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2">Editor shortcuts</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">Jump straight into writing fresh reviews or update your product models.</p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                setEditingArticleId(null);
                setActiveTab('article-editor');
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <PlusCircle size={14} />
              <span>Write Review Article</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('products');
              }}
              className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-xs font-bold transition"
            >
              <Database size={14} />
              <span>Manage Product DB</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
