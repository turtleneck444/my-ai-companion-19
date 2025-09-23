// SEO Utility Functions for LoveAI

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = (urls: SitemapUrl[]): string => {
  const urlElements = urls.map(url => `
    <url>
      <loc>${url.loc}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
      ${url.priority ? `<priority>${url.priority}</priority>` : ''}
    </url>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlElements}
</urlset>`;
};

export const getLoveAISitemapUrls = (baseUrl: string): SitemapUrl[] => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/pricing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/auth`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/app`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/create`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/library`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    }
  ];
};

// Generate structured data for different page types
export const generateWebApplicationSchema = (baseUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LoveAI',
  description: 'Advanced AI companion platform for meaningful emotional connections',
  url: baseUrl,
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  softwareVersion: '2.0',
  releaseDate: '2024-01-01',
  author: {
    '@type': 'Organization',
    name: 'LoveAI',
    url: baseUrl,
    sameAs: [
      'https://twitter.com/loveai_official',
      'https://facebook.com/loveai',
      'https://instagram.com/loveai_official'
    ]
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    category: 'AI Companion Service',
    availability: 'https://schema.org/InStock'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '1247',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Emotional AI conversations',
    'Voice calls with AI companions',
    'Personalized AI personalities',
    'Memory and relationship building',
    '24/7 availability',
    'Privacy and security focused'
  ]
});

export const generateOrganizationSchema = (baseUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LoveAI',
  url: baseUrl,
  logo: `${baseUrl}/thumbnail.png`,
  description: 'Leading AI companion platform providing emotional connections through advanced artificial intelligence',
  foundingDate: '2024',
  founders: [
    {
      '@type': 'Person',
      name: 'LoveAI Team'
    }
  ],
  sameAs: [
    'https://twitter.com/loveai_official',
    'https://facebook.com/loveai',
    'https://instagram.com/loveai_official'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@loveai.com'
  }
});

// Generate FAQ schema for landing page
export const generateFAQSchema = (faqs: Array<{question: string, answer: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Core Web Vitals and Performance helpers
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload hero image
  const heroImg = new Image();
  heroImg.src = '/thumbnail.png';
};

// Lazy loading helper for images
export const setupLazyLoading = () => {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading support
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img: any) => {
      img.src = img.dataset.src;
      img.loading = 'lazy';
    });
  } else {
    // Fallback for browsers without native support
    // Implementation would go here
  }
};

// Meta tag helpers
export const updateMetaTag = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
};

export const updateOpenGraphTag = (property: string, content: string) => {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}; 