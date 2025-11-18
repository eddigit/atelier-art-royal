import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedRites from '@/components/home/FeaturedRites';
import FeaturedProducts from '@/components/home/FeaturedProducts';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedRites />
      <FeaturedProducts />
    </div>
  );
}