import { ContributorSection } from './contributors';
import { Disclaimer } from './Disclaimer';
import { Features } from './features';
import { Hero } from './hero';
import NavComponent from './nav';
import React from 'react';
import WhyComponent from './why';

function LandingPage() {
  return (
    <div className='flex flex-col w-full pt-2'>
      <NavComponent />
      <Disclaimer />
      <Hero />
      <Features />
      <WhyComponent />
      <ContributorSection />
    </div>
  );
}

export default LandingPage;
