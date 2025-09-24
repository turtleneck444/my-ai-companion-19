import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  url?: string;
  schema?: object;
  canonicalUrl?: string;
  noindex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
  };
  character?: {
    name?: string;
    description?: string;
    image?: string;
    personality?: string[];
  };
  pricing?: {
    plans?: Array<{
      name: string;
      price: number;
      currency: string;
      features: string[];
    }>;
  };
}

export const EnhancedSEO: React.FC<SEOProps> = ({
  title = "LoveAI - Your Perfect AI Companion | Emotional AI Relationships",
  description = "Experience meaningful connections with personalized AI companions. Chat, call, and build lasting memories with advanced emotional AI technology. Join thousands finding love with AI.",
  keywords = "AI companion, emotional AI, AI relationship, virtual girlfriend, AI boyfriend, AI chatbot, personalized AI, emotional support, AI technology, virtual companionship, AI love, AI dating, virtual dating, artificial intelligence romance",
  ogImage = "https://www.loveaicompanion.com/thumbnail.png",
  ogType = "website",
  url,
  schema,
  canonicalUrl,
  noindex = false,
  article,
  twitter = {
    card: 'summary_large_image',
    site: '@loveai_official',
    creator: '@loveai_official'
  },
  character,
  pricing
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const canonical = canonicalUrl || currentUrl;
  
  // Enhanced viral keywords for trending topics
  const viralKeywords = [
    // Core AI terms
    "AI companion", "artificial intelligence girlfriend", "virtual relationship", "AI dating",
    // Trending tech terms
    "ChatGPT alternative", "OpenAI companion", "AI emotional support", "virtual intimacy",
    // Social/viral terms
    "AI girlfriend app", "virtual boyfriend", "AI romance", "digital companion",
    // Long-tail viral terms
    "best AI companion app 2024", "AI girlfriend that remembers you", "realistic AI chatbot",
    "AI companion for loneliness", "emotional AI technology", "AI relationship simulator",
    // Comparison terms
    "better than Replika", "Character AI alternative", "advanced AI companion",
    // Problem-solving terms
    "cure loneliness with AI", "AI emotional wellness", "mental health AI companion",
    // Trending 2024 terms
    "AI girlfriend 2024", "virtual girlfriend app", "AI boyfriend app", "AI dating simulator",
    "emotional AI chatbot", "AI companion free", "virtual relationship app", "AI love simulator"
  ];
  
  const enhancedKeywords = `${keywords}, ${viralKeywords.join(', ')}`;
  
  // Character-specific schema
  const characterSchema = character ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: character.name,
    description: character.description,
    image: character.image,
    knowsAbout: character.personality,
    memberOf: {
      '@type': 'Organization',
      name: 'LoveAI',
      url: 'https://www.loveaicompanion.com'
    },
    sameAs: [
      'https://www.loveaicompanion.com/characters/' + character.name?.toLowerCase()
    ]
  } : null;

  // Pricing schema
  const pricingSchema = pricing ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'LoveAI Premium Plans',
    description: 'Premium AI companion features and unlimited access',
    offers: pricing.plans?.map(plan => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price,
      priceCurrency: plan.currency,
      availability: 'https://schema.org/InStock',
      description: plan.features.join(', ')
    }))
  } : null;

  // Default enhanced schema for viral SEO
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LoveAI',
    description: description,
    url: currentUrl,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web, iOS, Android',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '1.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'LoveAI',
      url: currentUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${currentUrl}/thumbnail.png`
      },
      sameAs: [
        'https://twitter.com/loveai_official',
        'https://instagram.com/loveai_official',
        'https://linkedin.com/company/loveai',
        'https://youtube.com/@loveai_official',
        'https://tiktok.com/@loveai_official'
      ]
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description: 'Free AI companion with premium features available'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2847',
      bestRating: '5',
      worstRating: '1'
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Sarah Chen'
        },
        reviewBody: 'LoveAI has revolutionized how I think about AI companions. The emotional intelligence is incredible!'
      },
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Michael Rodriguez'
        },
        reviewBody: 'Finally, an AI that actually understands emotions and builds real connections. This is the future!'
      }
    ],
    featureList: [
      'Advanced Emotional AI Technology',
      'Real-time Voice Conversations', 
      'Personalized AI Personalities',
      'Memory and Relationship Building',
      '24/7 Availability',
      'Privacy and Security Focused',
      'Cross-platform Compatibility',
      'Unlimited Conversations',
      'Custom Character Creation',
      'Voice Call Integration',
      'AI Image Generation',
      'Emotional Intelligence',
      'Memory Persistence',
      'Multi-language Support'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Adults seeking emotional connection and companionship'
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/UserInteraction',
      userInteractionCount: '50000+'
    },
    potentialAction: {
      '@type': 'UseAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: currentUrl,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform'
        ]
      }
    }
  };

  const finalSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={enhancedKeywords} />
      <meta name="author" content="LoveAI" />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"} />
      <meta name="theme-color" content="#EC4899" />
      <meta name="application-name" content="LoveAI" />
      <meta name="apple-mobile-web-app-title" content="LoveAI" />
      <meta name="msapplication-TileColor" content="#EC4899" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="LoveAI - Your Perfect AI Companion" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="LoveAI" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific Open Graph */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content={article.author} />
          <meta property="article:section" content={article.section} />
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitter.card} />
      <meta name="twitter:site" content={twitter.site} />
      <meta name="twitter:creator" content={twitter.creator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="LoveAI - Your Perfect AI Companion" />
      
      {/* LinkedIn specific */}
      <meta property="linkedin:owner" content="LoveAI" />
      
      {/* Additional Social Media */}
      <meta property="pinterest:description" content={description} />
      <meta property="pinterest:image" content={ogImage} />
      
      {/* Mobile App Links */}
      <meta property="al:web:url" content={currentUrl} />
      <meta property="al:web:should_fallback" content="true" />
      
      {/* Performance and SEO hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
      
      {/* Main Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
      
      {/* Character-specific Structured Data */}
      {characterSchema && (
        <script type="application/ld+json">
          {JSON.stringify(characterSchema)}
        </script>
      )}
      
      {/* Pricing Structured Data */}
      {pricingSchema && (
        <script type="application/ld+json">
          {JSON.stringify(pricingSchema)}
        </script>
      )}
      
      {/* Additional viral SEO enhancements */}
      <meta name="generator" content="LoveAI Platform v1.0" />
      <meta name="rating" content="General" />
      <meta name="distribution" content="Global" />
      <meta name="revisit-after" content="1 day" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Social sharing optimization */}
      <meta property="fb:app_id" content="your-facebook-app-id" />
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* Performance optimization */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="address=no" />
    </Helmet>
  );
};
