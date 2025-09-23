// Advanced Sitemap Generator for LoveAI Platform
// Optimized for search engines and viral discovery

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
  videos?: Array<{
    thumbnail_loc: string;
    title: string;
    description: string;
    content_loc?: string;
    player_loc?: string;
    duration?: number;
    publication_date?: string;
  }>;
}

export function generateLoveAISitemap(): SitemapUrl[] {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loveai.app';
  const currentDate = new Date().toISOString();

  const urls: SitemapUrl[] = [
    // Main pages - high priority for viral discovery
    {
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0,
      images: [
        {
          loc: `${baseUrl}/thumbnail.png`,
          caption: 'LoveAI - Your Perfect AI Companion',
          title: 'LoveAI Platform Homepage'
        },
        {
          loc: `${baseUrl}/chat.png`,
          caption: 'Real AI Chat Interface',
          title: 'LoveAI Chat Experience'
        }
      ]
    },
    {
      loc: `${baseUrl}/auth`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/pricing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/app`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/create`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },

    // SEO Landing Pages for Viral Keywords
    {
      loc: `${baseUrl}/ai-companion`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/ai-girlfriend`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/virtual-relationship`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/emotional-ai`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/ai-dating`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },

    // Comparison Pages (high viral potential)
    {
      loc: `${baseUrl}/vs-replika`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/vs-character-ai`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/chatgpt-alternative`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7,
    },

    // Guide Pages for Long-tail SEO
    {
      loc: `${baseUrl}/how-to-create-ai-companion`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/ai-companion-guide`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/emotional-ai-benefits`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/ai-relationships-future`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },

    // Blog/Content Pages
    {
      loc: `${baseUrl}/blog`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/blog/ai-companion-revolution`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/blog/future-of-ai-relationships`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/blog/emotional-ai-breakthrough`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/blog/ai-loneliness-solution`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },

    // Support and Info Pages
    {
      loc: `${baseUrl}/privacy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.4,
    },
    {
      loc: `${baseUrl}/help`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.5,
    },
    {
      loc: `${baseUrl}/faq`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.5,
    },

    // Feature-specific pages
    {
      loc: `${baseUrl}/features/voice-calls`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/features/personality-customization`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/features/memory-system`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/features/emotional-intelligence`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },

    // Character/Avatar pages
    {
      loc: `${baseUrl}/characters`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/characters/luna`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
      images: [
        {
          loc: `${baseUrl}/avatar-luna.jpg`,
          caption: 'Luna - AI Companion',
          title: 'Meet Luna, your AI companion'
        }
      ]
    },
    {
      loc: `${baseUrl}/characters/aria`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
      images: [
        {
          loc: `${baseUrl}/avatar-aria.jpg`,
          caption: 'Aria - AI Companion',
          title: 'Meet Aria, your AI companion'
        }
      ]
    },
    {
      loc: `${baseUrl}/characters/sophie`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
      images: [
        {
          loc: `${baseUrl}/avatar-sophie.jpg`,
          caption: 'Sophie - AI Companion',
          title: 'Meet Sophie, your AI companion'
        }
      ]
    },

    // API Documentation (for developers)
    {
      loc: `${baseUrl}/api-docs`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.4,
    },

    // Success Stories (user-generated content)
    {
      loc: `${baseUrl}/success-stories`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/testimonials`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.6,
    },

    // Trending/Viral pages
    {
      loc: `${baseUrl}/trending`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/viral-moments`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.7,
    }
  ];

  return urls;
}

export function generateSitemapXML(): string {
  const urls = generateLoveAISitemap();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

  urls.forEach(url => {
    xml += `
  <url>
    <loc>${url.loc}</loc>`;
    
    if (url.lastmod) {
      xml += `
    <lastmod>${url.lastmod}</lastmod>`;
    }
    
    if (url.changefreq) {
      xml += `
    <changefreq>${url.changefreq}</changefreq>`;
    }
    
    if (url.priority) {
      xml += `
    <priority>${url.priority}</priority>`;
    }

    // Add images
    if (url.images && url.images.length > 0) {
      url.images.forEach(image => {
        xml += `
    <image:image>
      <image:loc>${image.loc}</image:loc>`;
        if (image.caption) {
          xml += `
      <image:caption>${image.caption}</image:caption>`;
        }
        if (image.title) {
          xml += `
      <image:title>${image.title}</image:title>`;
        }
        xml += `
    </image:image>`;
      });
    }

    // Add videos
    if (url.videos && url.videos.length > 0) {
      url.videos.forEach(video => {
        xml += `
    <video:video>
      <video:thumbnail_loc>${video.thumbnail_loc}</video:thumbnail_loc>
      <video:title>${video.title}</video:title>
      <video:description>${video.description}</video:description>`;
        if (video.content_loc) {
          xml += `
      <video:content_loc>${video.content_loc}</video:content_loc>`;
        }
        if (video.player_loc) {
          xml += `
      <video:player_loc>${video.player_loc}</video:player_loc>`;
        }
        if (video.duration) {
          xml += `
      <video:duration>${video.duration}</video:duration>`;
        }
        if (video.publication_date) {
          xml += `
      <video:publication_date>${video.publication_date}</video:publication_date>`;
        }
        xml += `
    </video:video>`;
      });
    }

    xml += `
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
}

// Generate robots.txt with viral optimization
export function generateRobotsTxt(): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loveai.app';
  
  return `User-agent: *
Allow: /

# Prioritize important pages for faster indexing
Allow: /
Allow: /auth
Allow: /pricing
Allow: /app
Allow: /create
Allow: /ai-companion
Allow: /ai-girlfriend
Allow: /viral-moments
Allow: /trending

# Block admin and API endpoints
Disallow: /api/
Disallow: /admin/
Disallow: /.netlify/
Disallow: /private/

# Block staging and development paths
Disallow: /dev/
Disallow: /staging/
Disallow: /test/

# Allow social media crawlers
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /

# Optimize crawl rate for viral content
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/image-sitemap.xml
Sitemap: ${baseUrl}/video-sitemap.xml

# Last updated: ${new Date().toISOString()}`;
}

// Generate structured data for viral discovery
export function generateViralStructuredData() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loveai.app';
  
  return {
    // Main Organization Schema
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LoveAI',
      url: baseUrl,
      logo: `${baseUrl}/thumbnail.png`,
      description: 'Revolutionary AI companion platform for meaningful emotional connections',
      foundingDate: '2024',
      sameAs: [
        'https://twitter.com/loveai_official',
        'https://instagram.com/loveai_official',
        'https://linkedin.com/company/loveai',
        'https://youtube.com/@loveai_official',
        'https://tiktok.com/@loveai_official',
        'https://facebook.com/loveai.official'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-LOVEAI',
        contactType: 'Customer Service',
        availableLanguage: ['English'],
        areaServed: 'Worldwide'
      }
    },

    // Software Application Schema
    softwareApplication: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LoveAI',
      operatingSystem: 'Web Browser, iOS, Android',
      applicationCategory: 'SocialNetworkingApplication',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '2847'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },

    // FAQ Schema for voice search optimization
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is LoveAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'LoveAI is an advanced AI companion platform that creates meaningful emotional connections through realistic conversations, voice calls, and personalized interactions.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is LoveAI free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! LoveAI offers a free tier with unlimited conversations. Premium features are available for enhanced experiences.'
          }
        },
        {
          '@type': 'Question',
          name: 'How realistic are the AI companions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'LoveAI uses advanced GPT-4 technology with emotional intelligence algorithms to create incredibly realistic and meaningful conversations that feel natural and authentic.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can I customize my AI companion?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! You can customize personality traits, appearance, voice, interests, and relationship dynamics to create your perfect AI companion.'
          }
        }
      ]
    },

    // Video Object for viral content
    videoObject: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'LoveAI - Meet Your Perfect AI Companion',
      description: 'Experience the future of AI companionship with LoveAI. See how our emotional AI technology creates meaningful connections.',
      thumbnailUrl: `${baseUrl}/video-thumbnail.jpg`,
      uploadDate: '2024-01-01',
      duration: 'PT2M30S',
      contentUrl: `${baseUrl}/demo-video.mp4`
    }
  };
} 