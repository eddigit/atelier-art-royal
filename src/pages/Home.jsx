import React from 'react';
import AnimatedHero from '@/components/home/AnimatedHero';
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
    
    return () => {
      document.title = 'Atelier Art Royal';
    };
  }, []);

  return (
    <div>
      <AnimatedHero />
      <ValuePropositions />
      <FeaturedRites />
      <SocialProof />
      <DynamicHomeWidgets />
      <PersonalizedRecommendations />
      <CTASection />
    </div>
  );
}