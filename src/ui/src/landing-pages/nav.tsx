import { Button } from '../@/components/ui/button';
import React from 'react';
import { Users } from 'lucide-react';

export default function NavComponent() {
  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex items-center justify-between h-16'>
        <div className='flex items-center gap-2'>
          <Users className='w-6 h-6 text-green-600' />
          <span className='text-xl font-bold'>Community Tally</span>
        </div>
        <nav className='hidden gap-6 md:flex'>
          <a
            href='#about'
            className='text-sm font-medium hover:underline underline-offset-4'
          >
            About
          </a>
          <a
            href='#why'
            className='text-sm font-medium hover:underline underline-offset-4'
          >
            Purpose
          </a>
          <a
            href='#contribute'
            className='text-sm font-medium hover:underline underline-offset-4'
          >
            Contribute
          </a>
        </nav>
        <div className='flex gap-4'>
          <Button variant='outline' asChild>
            <a href='/ui/signup/'>Register</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
