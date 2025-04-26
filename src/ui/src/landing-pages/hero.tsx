import { ArrowRight } from 'lucide-react';
import { Button } from '../@/components/ui/button';

export function Hero() {
  return (
    <div className='flex flex-col justify-start overflow-hidden bg-gray-50'>
      <div className='flex flex-col w-full px-6 lg:px-8'>
        {/* Heading */}
        <div className='flex flex-row items-center justify-center w-full pt-4 '>
          <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>
            Community Tally
          </h1>
        </div>
        <div className='flex flex-col items-center justify-center w-full mt-4 text-center '>
          <p className='mt-6 text-lg leading-8 text-gray-700'>
            Empowering Kenyans to track, verify, and tally election results at
            the polling station level.
          </p>
          <p className='pt-4'>Built by the community, for the community.</p>
        </div>

        <div className='flex items-center justify-center pb-2 mt-8 gap-x-6'>
          <Button
            asChild
            className='bg-[#008751] hover:bg-[#006B40] z-[9999999] text-white'
          >
            <a href='https://community-tally.readthedocs.io/' className=''>
              Get started (Docs) <ArrowRight className='w-4 h-4 ml-2' />
            </a>
          </Button>
          <Button variant='outline'>Login/Signup</Button>
        </div>
      </div>
      {/* <div className='absolute inset-0 flex bg-gradient-to-br from-green-50 to-red-50 opacity-30' /> */}
    </div>
  );
}
