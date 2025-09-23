import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  schema?: object;
  noIndex?: boolean;
  canonical?: string;
}

export const SEO = ({
  title = 'LoveAI - Your Perfect AI Companion | Emotional AI Relationships',
  description = 'Experience meaningful connections with personalized AI companions. Chat, call, and build lasting memories with advanced emotional AI technology. Join thousands finding love with AI.',
  keywords = 'AI companion, emotional AI, AI relationship, virtual girlfriend, AI chatbot, personalized AI, emotional support, AI technology, virtual companionship, AI love',
  image = '/thumbnail.png',
  url = window.location.href,
  type = 'website',
  schema,
  noIndex = false,
  canonical
}: SEOProps) => {
  // Ensure image is absolute URL
  const imageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;
  
  // Default schema markup for LoveAI
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LoveAI',
    description: 'Advanced AI companion platform for meaningful emotional connections',
    url: window.location.origin,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'AI Companion Service'
    },
    author: {
      '@type': 'Organization',
      name: 'LoveAI',
      url: window.location.origin
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1247',
      bestRating: '5',
      worstRating: '1'
    }
  };

  const finalSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="LoveAI" />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="LoveAI" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@loveai_official" />
      <meta name="twitter:creator" content="@loveai_official" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Additional Meta Tags for Better SEO */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <meta name="application-name" content="LoveAI" />
      <meta name="apple-mobile-web-app-title" content="LoveAI" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}; 