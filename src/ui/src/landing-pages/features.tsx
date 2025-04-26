import { Check, Globe, Shield, Users } from 'lucide-react';

const features = [
  {
    name: 'Community-Driven',
    description:
      'Crowdsource and verify results from 46,000+ polling stations across Kenya',
    icon: Users
  },
  {
    name: 'Transparent',
    description:
      'Real-time dashboard showing verified tallies and community feedback',
    icon: Globe
  },
  {
    name: 'Non-Partisan',
    description: 'Focused on electoral integrity, not political affiliations',
    icon: Shield
  },
  {
    name: 'Open Source',
    description:
      'Built openly with the community, for maximum transparency and trust',
    icon: Check
  }
];

export function Features() {
  return (
    <div className='flex flex-col justify-start bg-white sm:py-8'>
      <div className='flex flex-col justify-start px-6 mx-auto max-w-7xl lg:px-8'>
        <div className='flex flex-col items-center justify-center max-w-2xl mx-auto lg:text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
            Bringing Transparency to Kenyan Elections
          </h2>
          <p className='mt-6 text-lg leading-8 text-gray-600'>
            Empowering citizens with tools to verify and track election results
            at every polling station.
          </p>
        </div>
        <div className='max-w-2xl mx-auto sm:mt-12 lg:mt-12 lg:max-w-4xl '>
          <dl className='grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16'>
            {features.map((feature) => (
              <div key={feature.name} className='relative pl-16'>
                <dt className='text-base font-semibold leading-7 text-gray-900'>
                  <div className='absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#008751]'>
                    <feature.icon
                      className='w-6 h-6 text-white'
                      aria-hidden='true'
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className='mt-2 text-base leading-7 text-gray-600'>
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
