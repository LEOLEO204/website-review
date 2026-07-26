import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArticleContext } from '../context/ArticleContext';
import { ProductContext } from '../context/ProductContext';
import { db } from '../db';
import { uncloakUrl, secureStorage } from '../utils/security';
import { Edit2, Bookmark } from 'lucide-react';
import ArticleEditor from './admin/ArticleEditor';

// Standalone helper to parse blocks for both getArticleImage and getArticleBlocks
const getArticleBlocksStatic = (art) => {
  if (!art) return [];
  return Array.isArray(art.blocks) && art.blocks.length > 0
    ? art.blocks
    : (Array.isArray(art.content)
      ? art.content
      : (typeof art.contentHtml === 'string' && art.contentHtml.trim().length > 0
        ? parseStringToBlocks(art.contentHtml)
        : (typeof art.content === 'string' && art.content.trim().length > 0
          ? parseStringToBlocks(art.content)
          : [])));
};

// Helper to extract merchant name from a URL
const getMerchantFromUrl = (url) => {
  if (!url) return 'Partner';
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const parts = domain.split('.');
    if (parts.length > 1) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return domain;
  } catch (e) {
    return 'Partner';
  }
};

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('/') || 
         trimmed.startsWith('data:image/');
};

const getArticleImage = (art, productsList = []) => {
  if (!art) return "";
  if (isValidImageUrl(art.image)) return art.image.trim();
  if (isValidImageUrl(art.imageUrl)) return art.imageUrl.trim();
  return "";
};

// Helper to parse strings (HTML or text paragraphs) into structured block objects
const parseStringToBlocks = (contentStr) => {
  if (!contentStr) return [];
  try {
    const parsed = JSON.parse(contentStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}

  const blocks = [];
  if (/<[a-z][\s\S]*>/i.test(contentStr)) {
    const tagRegex = /<(h2|h3|h4|p|div)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = tagRegex.exec(contentStr)) !== null) {
      const tag = match[1].toLowerCase();
      const innerContent = match[2].replace(/<[^>]+>/g, '').trim();
      if (innerContent) {
        if (tag.startsWith('h')) {
          blocks.push({
            type: 'heading',
            value: innerContent
          });
        } else {
          blocks.push({
            type: 'paragraph',
            value: innerContent
          });
        }
      }
    }
    if (blocks.length > 0) {
      return blocks;
    }
  }

  const paragraphs = contentStr.split(/\n\s*\n/).filter(p => p.trim());
  paragraphs.forEach((p) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      blocks.push({
        type: 'heading',
        value: trimmed.replace(/^###?\s+/, '')
      });
    } else {
      blocks.push({
        type: 'paragraph',
        value: trimmed
      });
    }
  });

  return blocks;
};

export default function ArticleDetailPage({ triggerAffiliate, searchQuery }) {
  const { slug } = useParams();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const pathPrefix = isAdminPath ? '/admin' : '';
  
  const articleContext = useContext(ArticleContext);
  const productContext = useContext(ProductContext);
  
  const articlesList = articleContext?.articles || db.getArticles() || [];
  const productsList = productContext?.products || db.getProducts() || [];
  
  const [article, setArticle] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const articleId = article?.id;

  useEffect(() => {
    setShowEditModal(false); // Close edit modal whenever the page slug changes
    // Find article: Try to match URL slug first (for normal navigation to other articles), 
    // then fallback to current ID (to handle title/slug updates of the active article)
    let art = articlesList.find(a => a.slug === slug || a.id === slug);
    if (!art && articleId) {
      art = articlesList.find(a => a.id === articleId);
    }
    if (!art) {
      art = db.getArticle(slug);
      if (art && articleContext && articleContext.setArticles) {
        articleContext.setArticles(prev => {
          if (!prev.some(a => a.id === art.id)) {
            return [...prev, art];
          }
          return prev;
        });
      }
    }
    if (art && art.slug && art.slug !== slug) {
      navigate(`${pathPrefix}/reviews/${art.slug}`, { replace: true });
    }
    setArticle(art || null);
  }, [slug, articlesList, articleContext, navigate, articleId]);

  // Listen for background database synchronization events from VPS SQLite
  useEffect(() => {
    const handleDbSynced = () => {
      const freshList = articleContext?.articles || db.getArticles() || [];
      const art = freshList.find(a => a.slug === slug || a.id === slug) || db.getArticle(slug);
      if (art) {
        setArticle(art);
      }
    };
    window.addEventListener('supabase-db-synced', handleDbSynced);
    return () => window.removeEventListener('supabase-db-synced', handleDbSynced);
  }, [slug, articleContext]);

  useEffect(() => {
    if (article && article.id) {
      const sessionKey = `viewed_article_${article.id}`;
      try {
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'true');
          if (articleContext && articleContext.incrementArticleClicks) {
            articleContext.incrementArticleClicks(article.id);
          }
        }
      } catch (e) {
        console.warn("SessionStorage view guard failed:", e);
        if (articleContext && articleContext.incrementArticleClicks) {
          articleContext.incrementArticleClicks(article.id);
        }
      }

      // Dynamic SEO Title & Meta Description
      if (article.title) {
        document.title = `${article.title} | ReviewSmart`;
      }
      if (article.intro) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', article.intro.replace(/<[^>]+>/g, '').trim());
        }
      }

      // Inject Schema.org Structured Data (JSON-LD)
      const scriptId = 'json-ld-article-schema';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      const articleImg = getArticleImage(article);
      const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            "@id": `https://review.totsystem.com/article/${article.slug || article.id}#article`,
            "isPartOf": {
              "@type": "WebPage",
              "@id": `https://review.totsystem.com/article/${article.slug || article.id}`
            },
            "headline": article.title,
            "description": (article.intro || article.title).replace(/<[^>]+>/g, '').trim(),
            "image": articleImg ? [articleImg] : [],
            "datePublished": article.date || article.createdAt,
            "author": {
              "@type": "Person",
              "name": article.author || "Hai Xuyen",
              "jobTitle": article.authorRole || "Senior Editor"
            },
            "publisher": {
              "@type": "Organization",
              "name": "ReviewSmart",
              "url": "https://review.totsystem.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://review.totsystem.com/favicon.svg"
              }
            }
          },
          {
            "@type": "BreadcrumbList",
            "@id": `https://review.totsystem.com/article/${article.slug || article.id}#breadcrumb`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://review.totsystem.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": article.category || "Articles",
                "item": `https://review.totsystem.com/category/${article.categoryId || 'web-hosting-software'}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": article.title
              }
            ]
          }
        ]
      };
      script.textContent = JSON.stringify(schemaData);
    }
  }, [article?.id, articleContext, article]);

  const isAdmin = useMemo(() => {
    try {
      return !!sessionStorage.getItem('wc_admin_session');
    } catch (e) {
      return false;
    }
  }, [location.pathname]);

  const sharedArticles = useMemo(() => {
    return article ? [article] : [];
  }, [article]);

  const recommendedArticles = useMemo(() => {
    if (!article || !article.subCategory) return [];
    const list = articlesList.filter(a => 
      a.id !== article.id && 
      a.categoryId === article.categoryId &&
      a.subCategory &&
      a.subCategory.toLowerCase().trim() === article.subCategory.toLowerCase().trim()
    );
    // Sort descending by date/createdAt to get the latest ones
    list.sort((a, b) => {
      const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
      const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
      return timeB - timeA;
    });
    return list.slice(0, 5);
  }, [article, articlesList]);

  const getArticleBlocks = (art) => {
    return getArticleBlocksStatic(art);
  };

  const getHeadings = (blocks, artIdx) => {
    const headings = [];
    (blocks || []).forEach(b => {
      if (b.type === 'heading' && (b.value || b.text)) {
        const text = b.value || b.text;
        const id = `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}`;
        headings.push({ level: 2, text, id });
      } else if ((b.type === 'text' || b.type === 'paragraph') && (b.value || b.text)) {
        const val = b.value || b.text;
        if (/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i.test(val)) {
          const hRegex = /<h([23])(?:[^>]*id=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/h\1>/gi;
          let match;
          while ((match = hRegex.exec(val)) !== null) {
            const level = parseInt(match[1], 10);
            const rawId = match[2];
            const innerText = match[3].replace(/<[^>]+>/g, '').trim();
            const id = rawId || `${innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}`;
            headings.push({ level, text: innerText, id });
          }
        } else {
          const lines = val.split('\n');
          lines.forEach(line => {
            if (line.startsWith('## ') || line.startsWith('### ')) {
              const level = line.startsWith('## ') ? 2 : 3;
              const text = line.replace(/^##* /, '').trim();
              const id = `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}`;
              headings.push({ level, text, id });
            }
          });
        }
      }
    });
    return headings;
  };

  const headings = useMemo(() => {
    if (!article) return [];
    return [
      {
        level: 2,
        text: article.title || 'Untitled Article',
        id: `article-header-${article.id || 0}`
      }
    ];
  }, [article]);

  // Set up intersection observer to highlight current heading in TOC
  useEffect(() => {
    if (headings.length === 0) return;
    
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!article) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-3">
          Article is under editorial review
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          We are currently testing products and writing this detailed guide. Please check back soon!
        </p>
        <a href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 transition duration-150 shadow-sm">
          Back to Home
        </a>
      </div>
    );
  }

  const parseMarkdownInline = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-bold text-slate-900">{highlightQuery(boldText, searchQuery)}</strong>;
      }
      const subParts = part.split(/(\*.*?\*)/g);
      return subParts.map((subPart, subIndex) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          const italicText = subPart.slice(1, -1);
          return <em key={`${index}-${subIndex}`} className="italic">{highlightQuery(italicText, searchQuery)}</em>;
        }
        return highlightQuery(subPart, searchQuery);
      });
    });
  };

  const renderTextBlock = (value, artIdx) => {
    if (!value) return null;
    if (/<[a-z][\s\S]*>/i.test(value)) {
      return (
        <div 
          key={artIdx || Math.random()}
          className="article-html-content space-y-4 text-slate-800 text-base md:text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: value }} 
        />
      );
    }
    const paragraphs = value.split('\n\n').filter(p => p.trim());
    return paragraphs.map((p, idx) => {
      if (p.startsWith('## ')) {
        const text = p.slice(3).trim();
        const id = `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}`;
        return (
          <h2 
            key={idx} 
            id={id} 
            className="text-2xl font-serif font-bold text-slate-900 mt-8 mb-4 scroll-mt-24"
          >
            {parseMarkdownInline(text)}
          </h2>
        );
      }
      if (p.startsWith('### ')) {
        const text = p.slice(4).trim();
        const id = `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}`;
        return (
          <h3 
            key={idx} 
            id={id} 
            className="text-xl font-serif font-bold text-slate-900 mt-6 mb-3 scroll-mt-24"
          >
            {parseMarkdownInline(text)}
          </h3>
        );
      }
      
      // Standard Paragraph
      return (
        <p key={idx} className="text-slate-800 text-base md:text-lg leading-relaxed mb-6">
          {parseMarkdownInline(p)}
        </p>
      );
    });
  };

  const highlightQuery = (text, query) => {
    return text;
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans text-left">
      
      {/* Category Navigation Bar */}
      <div className="border-b border-slate-100 py-3 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center space-x-2">
            <Link to="/" className="hover:text-slate-600 transition">HOME</Link>
            <span>/</span>
            <Link 
              to={article.categoryId ? `/category/${article.categoryId}` : '#'} 
              className="hover:text-slate-600 transition font-bold"
            >
              {article.category || 'REVIEWS'}
            </Link>
            {article.subCategory && (
              <>
                <span>/</span>
                <Link 
                  to={`/category/${article.categoryId}?sub=${encodeURIComponent(article.subCategory)}`}
                  className="text-indigo-600 hover:text-indigo-800 transition font-bold"
                >
                  {article.subCategory}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        



        {/* Content Layout: 2 Columns on desktop (TOC completely deleted) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Center Column Article Body - 8 Columns width if sidebar is present */}
          <main className={`${recommendedArticles.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} max-w-3xl space-y-12`}>
            {sharedArticles.map((art, artIdx) => {
              const blocks = getArticleBlocks(art);
              const isStringContent = typeof art.content === 'string' && art.content.trim().length > 0;
              const showStreamHeader = true;

              return (
                <div key={art.id || artIdx} className="space-y-8 relative">
                  
                  {showStreamHeader && (
                    <header id={`article-header-${art.id || artIdx}`} className={`mb-8 pt-6 scroll-mt-24 ${artIdx > 0 ? 'border-t border-slate-100' : ''}`}>
                      <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-slate-900 mb-3">
                        {highlightQuery(art.title, searchQuery)}
                      </h2>
                      
                      {art.intro && art.intro.toLowerCase().trim() !== 'jvjgjgv' && art.intro.toLowerCase().trim() !== 'jv' && (
                        <p className="text-lg font-serif text-slate-500 leading-relaxed font-light mb-4">
                          {highlightQuery(art.intro, searchQuery)}
                        </p>
                      )}

                      {/* Author info and release date */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400 pt-2 pb-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px]">
                              {art.author ? art.author.slice(0, 2).toUpperCase() : 'ED'}
                            </span>
                            <span>By <span className="text-slate-900 underline decoration-slate-300 underline-offset-2">{art.author || 'Staff Editors'}</span></span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <span>Updated {art.date || 'Today'}</span>
                        </div>
                        
                        {sessionStorage.getItem('wc_admin_session') !== null && (
                          <button 
                            onClick={() => setShowEditModal(true)}
                            className="inline-flex items-center gap-1.5 bg-[#f5f6ff] text-indigo-600 hover:bg-indigo-100 hover:text-indigo-850 px-2.5 py-1 rounded border border-indigo-100 font-sans tracking-wide transition font-bold text-[10px] cursor-pointer animate-fade-in"
                          >
                            <Edit2 size={10} />
                            Edit
                          </button>
                        )}
                      </div>
                    </header>
                  )}

                  {/* Affiliate Disclosure Banner (FTC Compliant) */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 text-xs text-slate-550 leading-relaxed font-sans flex items-start gap-3 mb-6 select-none animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-extrabold text-[10px]">i</span>
                    <div>
                      <span className="font-extrabold text-slate-800 mr-1.5">Affiliate Disclosure:</span>
                      As an Amazon Associate and affiliate partner of other brands, we earn from qualifying purchases. When you click on links to buy products on our site, we may receive a small commission at no additional cost to you. This helps support our independent editorial team. <Link to="/about" className="text-indigo-600 hover:text-indigo-800 underline font-bold transition">Learn more</Link>.
                    </div>
                  </div>

                  {/* Main Cover Image at the top of the article */}
                  {getArticleImage(art, productsList) && (
                    <div className="w-full overflow-hidden mb-8 rounded-lg flex justify-center">
                      <img 
                        src={getArticleImage(art, productsList)} 
                        alt={art.title} 
                        className="w-full h-auto max-h-[550px] object-contain rounded-lg" 
                      />
                    </div>
                  )}

                  {blocks && blocks.length > 0 ? (
                    <div className="space-y-6">
                      {blocks.map((block) => {
                        // Heading block
                        if (block.type === 'heading') {
                          const text = block.value || block.text;
                          const id = text ? `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artIdx}` : '';
                          return (
                            <h2 
                              key={block.id || block.productId || Math.random()} 
                              id={id} 
                              className="text-2xl font-serif font-bold text-slate-900 mt-8 mb-4 scroll-mt-24"
                            >
                              {highlightQuery(text, searchQuery)}
                            </h2>
                          );
                        }

                        // Paragraph block
                        if (block.type === 'paragraph') {
                          return (
                            <p key={block.id || block.productId || Math.random()} className="text-slate-800 text-base md:text-lg leading-relaxed mb-6">
                              {highlightQuery(block.value || block.text, searchQuery)}
                            </p>
                          );
                        }

                        // Legacy text block or admin text block with inline markup
                        if (block.type === 'text') {
                          if (block.image && block.refLink) {
                            const lines = (block.value || '').split('\n');
                            let pickTitle = '';
                            let pickDescLines = [];
                            lines.forEach(line => {
                              if ((line.startsWith('## ') || line.startsWith('### ')) && !pickTitle) {
                                pickTitle = line.replace(/^##* /, '').trim();
                              } else {
                                pickDescLines.push(line);
                              }
                            });
                            
                            const displayTitle = pickTitle || art.title || 'Top Pick';
                            const merchantName = getMerchantFromUrl(block.refLink);
                            const mainProduct = productsList[0];
                            const cardTitle = block.ctaTitle || (mainProduct ? mainProduct.name : displayTitle);
                            const cardShortDesc = block.ctaDesc || (mainProduct ? mainProduct.shortDescription : 'Recommended optimal pick based on extensive testing and review.');
                            
                            return (
                              <div key={block.id || Math.random()} className="space-y-6">
                                {/* 1. Render all paragraphs normally outside the card */}
                                <div className="space-y-6">
                                  {renderTextBlock(block.value || '', artIdx)}
                                </div>

                                {/* 2. Render the call-to-action pick card at the bottom */}
                                <div className="border-2 border-slate-950 rounded-none p-12 mb-16 bg-white relative text-left shadow-md">
                                  {/* Blue Ribbon Badge */}
                                  <div 
                                    className="absolute -top-5 left-8 bg-[#5c6ac4] text-white font-sans font-bold text-base uppercase px-6 pr-8 py-2.5 select-none shadow-sm"
                                    style={{ clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)' }}
                                  >
                                    TOP PICK
                                  </div>
                                  
                                  <div className="md:grid md:grid-cols-5 md:gap-10 mt-6 items-center">
                                    {/* Left column: Product image (width: 2/5) */}
                                    <div className="md:col-span-2 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden bg-slate-900 border border-slate-200">
                                      <img 
                                        src={block.image} 
                                        alt={cardTitle} 
                                        className="object-cover w-full h-full max-h-[360px] group-hover:scale-105 transition duration-300 rounded-2xl" 
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'; }}
                                      />
                                    </div>

                                    {/* Right column: Product details & Buttons (width: 3/5) */}
                                    <div className="md:col-span-3 flex flex-col justify-between mt-8 md:mt-0">
                                      <div>
                                        <div className="flex justify-between items-start mb-4">
                                          <h4 className="font-sans text-slate-900 text-3xl font-bold leading-snug">
                                            {highlightQuery(cardTitle, searchQuery)}
                                          </h4>
                                        </div>
                                        
                                        <p className="text-slate-700 leading-relaxed mb-8 font-sans text-base">
                                          {highlightQuery(cardShortDesc, searchQuery)}
                                        </p>
                                      </div>

                                      {/* Buttons stack */}
                                      <div className="flex flex-col space-y-4 max-w-xl w-full mt-6">
                                        <a
                                          href={uncloakUrl(block.refLink) || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer sponsored"
                                          className="w-full bg-black text-white font-bold py-4 px-6 rounded-lg text-center hover:bg-slate-800 transition-all text-base block font-sans"
                                        >
                                          Buy Now
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={block.id || Math.random()} className="space-y-6">
                              {renderTextBlock(block.value || '', artIdx)}
                              {block.image && (
                                <div className="my-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-3xl mx-auto bg-slate-50 flex items-center justify-center p-2">
                                  <img src={block.image} className="w-full h-auto max-h-[500px] object-contain rounded-xl" alt="Editorial image" />
                                </div>
                              )}
                              {block.refLink && (
                                <div className="my-4 flex flex-col items-center justify-center">
                                  <a 
                                    href={uncloakUrl(block.refLink)} 
                                    target="_blank" 
                                    rel="noopener noreferrer sponsored" 
                                    className="inline-block bg-black hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-center transition text-sm font-sans min-w-[200px]"
                                  >
                                    Buy now from {getMerchantFromUrl(block.refLink)}
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                         // Product pick block
                         if (block.type === 'product_pick' || block.type === 'pick') {
                           const prod = productsList.find(p => p.id === block.productId);
                           
                           if (!prod) {
                             return (
                               <div key={block.id || block.productId || Math.random()} className="border border-dashed border-slate-200 p-4 text-xs text-slate-400 font-serif">
                                 [Product data not loaded: ID {block.productId}]
                               </div>
                             );
                           }

                           const badgeText = (block.badge || prod.badge || 'THE BEST').toUpperCase();

                           return (
                             <div 
                               key={block.id || block.productId || Math.random()} 
                               className="border-2 border-slate-950 rounded-none p-12 mb-16 bg-white relative text-left shadow-md"
                             >
                               {/* Blue Ribbon Badge */}
                               <div 
                                 className="absolute -top-5 left-8 bg-[#5c6ac4] text-white font-sans font-bold text-base uppercase px-6 pr-8 py-2.5 select-none shadow-sm"
                                 style={{ clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)' }}
                               >
                                 {badgeText}
                               </div>
                               
                               <div className="md:grid md:grid-cols-3 md:gap-16 mt-6">
                                 <div className="md:col-span-1 bg-white flex items-center justify-center p-4">
                                   <img 
                                     src={prod.imageUrl || prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
                                     alt={prod.name} 
                                     className="object-contain max-h-[350px] w-full mx-auto"
                                     onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'; }}
                                   />
                                 </div>

                                 <div className="md:col-span-2 flex flex-col justify-between mt-8 md:mt-0">
                                   <div>
                                     <div className="flex justify-between items-start mb-4">
                                       {(block.title || block.heading || prod.tagline) && (
                                         <h4 className="font-sans text-slate-900 text-3xl font-bold leading-snug">
                                           {highlightQuery(block.title || block.heading || prod.tagline, searchQuery)}
                                         </h4>
                                       )}
                                     </div>

                                     <p className="text-slate-700 leading-relaxed mb-8 font-sans text-base">
                                       {highlightQuery(block.reason || prod.shortDescription, searchQuery)}
                                     </p>
                                   </div>

                                   <div className="flex flex-col space-y-4 max-w-xl w-full mt-6">
                                     {prod.price && prod.merchant && (
                                       <a
                                         href={uncloakUrl(prod.buyUrl) || '#'}
                                         rel="noopener noreferrer sponsored"
                                         onClick={(e) => triggerAffiliate(prod.merchant, uncloakUrl(prod.buyUrl), e)}
                                         className="w-full bg-black text-white font-bold py-4 px-6 rounded-lg text-center hover:bg-slate-800 transition-all text-base block font-sans"
                                       >
                                         Buy Now
                                       </a>
                                     )}
                                     
                                     {prod.affiliateLinks && prod.affiliateLinks.map((link, idx) => (
                                       <a
                                         key={idx}
                                         href={uncloakUrl(link.link || link.buyUrl) || '#'}
                                         rel="noopener noreferrer sponsored"
                                         onClick={(e) => triggerAffiliate(link.retailer || link.merchant, uncloakUrl(link.link || link.buyUrl), e)}
                                         className="w-full bg-black text-white font-bold py-4 px-6 rounded-lg text-center hover:bg-slate-800 transition-all text-base block font-sans"
                                       >
                                         Buy Now
                                       </a>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             </div>
                           );
                         }
                         return null;
                       })}
                    </div>
                  ) : (
                    <div 
                      id={`review-body-${artIdx}`} 
                      className="font-serif text-slate-700 leading-relaxed space-y-5 text-[17px] focus:outline-none"
                      dangerouslySetInnerHTML={{ 
                        __html: isStringContent 
                          ? (art.content || '').replace(/id="(.*?)"/g, `id="$1-${artIdx}"`) 
                          : (art.contentHtml || '').replace(/id="(.*?)"/g, `id="$1-${artIdx}"`)
                      }}
                    />
                  )}

                  {/* Horizontal divider line between articles */}
                  {artIdx < sharedArticles.length - 1 && (
                    <div className="py-6">
                      <hr className="border-t border-slate-200 border-dashed" />
                    </div>
                  )}

                </div>
              );
            })}

            {/* Recommendations Widget for Mobile/Tablet (Shown only on small screens) */}
            {recommendedArticles.length > 0 && (
              <section className="block lg:hidden pt-8 border-t-2 border-black mt-14 max-w-xl space-y-6 text-left">
                <h3 className="font-sans font-black text-2xl text-slate-900 leading-snug tracking-tight">
                  Looking for something else?
                </h3>
                
                <div className="space-y-4">
                  {recommendedArticles.map(rec => (
                    <Link 
                      key={rec.id} 
                      to={`/reviews/${rec.slug}`} 
                      className="group flex items-center gap-6 py-2 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="w-40 h-24 bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0 rounded-lg shadow-sm">
                        <img 
                          src={getArticleImage(rec, productsList)} 
                          alt={rec.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-black text-base text-slate-900 group-hover:text-indigo-600 transition duration-150 leading-snug">
                          {rec.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>

                {article && (
                  <div className="pt-4 text-base font-sans text-slate-700">
                    Read more from{' '}
                    <Link 
                      to={`/category/${article.categoryId}${article.subCategory ? `?sub=${encodeURIComponent(article.subCategory)}` : ''}`}
                      className="font-extrabold text-black underline hover:text-indigo-600 transition duration-150 text-base"
                    >
                      {article.subCategory || article.category || 'Reviews'}
                    </Link>
                  </div>
                )}
              </section>
            )}
          </main>

          {/* Right Column Sidebar (Suggestions) - 4 Columns width (Desktop only) */}
          {recommendedArticles.length > 0 && (
            <aside className="lg:col-span-4 hidden lg:block pl-6 border-l border-slate-100">
              <div className="lg:sticky lg:top-24 border-t-2 border-black pt-6 space-y-6">
                <h3 className="font-sans font-black text-2xl text-slate-900 leading-snug tracking-tight">
                  Looking for something else?
                </h3>
                
                <div className="space-y-4">
                  {recommendedArticles.map(rec => (
                    <Link 
                      key={rec.id} 
                      to={`/reviews/${rec.slug}`} 
                      className="group flex items-center gap-4 py-2 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="w-40 h-24 bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0 rounded-lg shadow-sm">
                        <img 
                          src={getArticleImage(rec, productsList)} 
                          alt={rec.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-black text-base text-slate-900 group-hover:text-indigo-600 transition duration-150 leading-snug">
                          {rec.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>

                {article && (
                  <div className="pt-4 text-base font-sans text-slate-700">
                    Read more from{' '}
                    <Link 
                      to={`/category/${article.categoryId}${article.subCategory ? `?sub=${encodeURIComponent(article.subCategory)}` : ''}`}
                      className="font-extrabold text-black underline hover:text-indigo-600 transition duration-150 text-base"
                    >
                      {article.subCategory || article.category || 'Reviews'}
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          )}

        </div>

      </div>

      {/* Edit Article Modal */}
      {showEditModal && article && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-sans font-bold text-sm text-slate-800 uppercase tracking-wider">Chỉnh Sửa Bài Viết</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ArticleEditor 
                editingArticleId={article.id} 
                setEditingArticleId={() => {}} 
                onCancel={(savedArticle) => {
                  setShowEditModal(false);
                  if (savedArticle) {
                    setArticle(savedArticle);
                    if (savedArticle.slug && savedArticle.slug !== slug) {
                      navigate(`${pathPrefix}/reviews/${savedArticle.slug}`, { replace: true });
                    }
                  } else {
                    const allArts = articleContext?.articles || db.getArticles() || [];
                    const updated = allArts.find(a => a.id === article.id) || db.getArticle(article.id);
                    if (updated) {
                      setArticle(updated);
                      if (updated.slug && updated.slug !== slug) {
                        navigate(`${pathPrefix}/reviews/${updated.slug}`, { replace: true });
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
