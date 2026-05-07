import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import ValuePropositions from '@/components/home/ValuePropositions';
import FeaturedRites from '@/components/home/FeaturedRites';
import SocialProof from '@/components/home/SocialProof';
import PersonalizedRecommendations from '@/components/home/PersonalizedRecommendations';
import CTASection from '@/components/home/CTASection';
import DynamicHomeWidgets from '@/components/home/DynamicHomeWidgets';

export default function Home() {
  // SEO Meta Tags
  React.useEffect(() => {
    document.title = 'Atelier Art Royal - Haute Couture Maçonnique | Tabliers, Sautoirs & Bijoux';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Découvrez l\'excellence de la haute couture maçonnique française. Tabliers, sautoirs, bijoux et décors sur mesure pour tous les rites (REAA, RER, GLDF). Fabrication artisanale, qualité supérieure.';
    
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = 'tablier maçonnique, sautoir maçonnique, bijoux maçonniques, décors maçonniques, REAA, RER, GLDF, franc-maçonnerie, haute couture maçonnique, artisanat français';
    
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = 'Atelier Art Royal - Haute Couture Maçonnique';
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = 'Excellence de la haute couture maçonnique française. Tabliers, sautoirs et bijoux sur mesure pour tous les rites.';
    
    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://artroyal.fr/');

    // JSON-LD Organization + WebSite
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://artroyal.fr/#organization',
          name: 'Atelier Art Royal',
          url: 'https://artroyal.fr/',
          logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/b5c892460_logo-dark-web.png',
          contactPoint: { '@type': 'ContactPoint', telephone: '+33-6-46-68-36-10', email: 'contact@artroyal.fr', contactType: 'customer service', areaServed: 'FR', availableLanguage: 'French' },
        },
        {
          '@type': 'WebSite',
          '@id': 'https://artroyal.fr/#website',
          url: 'https://artroyal.fr/',
          name: 'Atelier Art Royal',
          publisher: { '@id': 'https://artroyal.fr/#organization' },
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://artroyal.fr/Catalog?search={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    };
    let ldTag = document.getElementById('home-jsonld');
    if (!ldTag) {
      ldTag = document.createElement('script');
      ldTag.type = 'application/ld+json';
      ldTag.id = 'home-jsonld';
      document.head.appendChild(ldTag);
    }
    ldTag.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'Atelier Art Royal';
    };
  }, []);

  return (
    <div>
      <HeroSection />
      <ValuePropositions />
      <FeaturedRites />
      <SocialProof />
      <DynamicHomeWidgets />
      <PersonalizedRecommendations />
      <CTASection />
    </div>
  );
}