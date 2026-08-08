/**
 * SEO Manager Utility for ReviewSmart
 * Dynamically updates document head tags:
 * - Title & Meta Description
 * - Canonical link (<link rel="canonical" href="...">)
 * - Meta Robots (<meta name="robots" content="...">)
 * - Open Graph Metadata (og:title, og:image, og:description, og:url, twitter:card)
 */

export function setSEOHead({
  title,
  description,
  canonicalUrl,
  imageUrl,
  noindex = false,
  ogType = 'website'
}) {
  const currentUrl = canonicalUrl || window.location.href.split('?')[0];

  // 1. Title Tag
  if (title) {
    document.title = title.includes('ReviewSmart') ? title : `${title} | ReviewSmart`;
  }

  // Helper for meta tags
  const setMetaTag = (selector, attrName, attrValue, content) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Helper for link tags
  const setLinkTag = (rel, href) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // 2. Meta Description
  if (description) {
    const cleanDesc = description.replace(/<[^>]+>/g, '').trim();
    setMetaTag('meta[name="description"]', 'name', 'description', cleanDesc);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', cleanDesc);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', cleanDesc);
  }

  // 3. Canonical Link Tag (Criterion 7)
  setLinkTag('canonical', currentUrl);

  // 4. Meta Robots Tag (Criterion 4)
  if (noindex) {
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
  } else {
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }

  // 5. Open Graph & Twitter Metadata (Criterion 24)
  const metaTitle = title ? (title.includes('ReviewSmart') ? title : `${title} | ReviewSmart`) : 'ReviewSmart | Expert Product Reviews and Buying Advice';
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', metaTitle);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', metaTitle);

  setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);

  const defaultImg = 'https://review.totsystem.com/favicon.svg';
  const ogImg = imageUrl || defaultImg;
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImg);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImg);
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
}
