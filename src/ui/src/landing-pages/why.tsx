import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../@/components/ui/card';

import React from 'react';
import { XCircle } from 'lucide-react';

function WhyComponent() {
  return (
    <section
      id='why'
      className='w-full py-4 md:py-6 bg-slate-50 dark:bg-slate-950'
    >
      <div className='container px-4 md:px-6'>
        <div className='grid gap-6 lg:grid-cols-2 lg:gap-12'>
          <div className='space-y-4'>
            <div className='inline-block px-3 py-1 text-sm bg-green-100 rounded-lg dark:bg-green-800'>
              What This Project Is
            </div>
            <div className='space-y-2'>
              <h2 className='text-3xl font-bold tracking-tighter'>
                Our Mission
              </h2>
              <p className='text-muted-foreground'>
                Community Tally is designed to be a tool for civic empowerment
                and transparency.
              </p>
            </div>
            <div className='space-y-2'>
              {[
                'A citizen-driven platform to increase transparency and accountability',
                'An open-source system built for collaboration',
                'A tool for civic empowerment, not political affiliation',
                'A platform for education, participation, and digital oversight'
              ].map((item, index) => (
                <Card key={index}>
                  <CardContent className=''>
                    <div className='flex items-start gap-4'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <p>{item}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='inline-block px-3 py-1 text-sm bg-red-100 rounded-lg dark:bg-red-900'>
              What This Project Is NOT
            </div>
            <div className='space-y-2'>
              <h2 className='text-3xl font-bold tracking-tighter'>
                Important Limitations
              </h2>
              <p className='text-muted-foreground'>
                Understanding what Community Tally is not helps set proper
                expectations.
              </p>
            </div>
            <div className='space-y-2'>
              {[
                'Not a system to legally challenge election results',
                'Not a means to announce or declare election results',
                'Not an official government or IEBC system',
                'Not a replacement for legal electoral processes',
                'Not a partisan or politically-affiliated project'
              ].map((item, index) => (
                <Card key={index}>
                  <CardContent className=''>
                    <div className='flex items-start gap-4'>
                      <XCircle className='w-5 h-5 text-red-600' />
                      <p>{item}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyComponent;
