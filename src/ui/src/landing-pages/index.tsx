import { ContributorSection } from './contributors';
import { Disclaimer } from './Disclaimer';
import { Features } from './features';
import { Hero } from './hero';
import React from 'react';

function LandingPage() {
  return (
    <div className='flex flex-col w-full pt-2'>
      <Disclaimer />
      <Hero />
      <Features />
      <ContributorSection />
    </div>
  );
}

export default LandingPage;
