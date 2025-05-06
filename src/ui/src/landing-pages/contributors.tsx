const contributors = [
  {
    role: 'Developers',
    description: 'Backend & Frontend (Django, React)',
    emoji: '🧑‍💻'
  },
  {
    role: 'Security Experts',
    description: 'Software verification & data integrity',
    emoji: '🛡️'
  },
  {
    role: 'Legal Professionals',
    description: 'Electoral laws & privacy rights',
    emoji: '⚖️'
  },
  {
    role: 'Community Organizers',
    description: 'Local mobilization & awareness',
    emoji: '🧑🏾‍🤝‍🧑🏽'
  }
];

export function ContributorSection() {
  return (
    <div id='contribute' className=' bg-gray-50 sm:py-8'>
      <div className='px-6 mx-auto max-w-7xl lg:px-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
            Join the Movement
          </h2>
          <p className='mt-6 text-lg leading-8 text-gray-600'>
            We need all hands on deck to make this project successful. Find your
            role in strengthening Kenyan democracy.
          </p>
        </div>
        <div className='max-w-2xl mx-auto mt-4 sm:mt-8 lg:mt-8 lg:max-w-4xl'>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2'>
            {contributors.map((contributor) => (
              <div
                key={contributor.role}
                className='relative p-8 transition-shadow bg-white shadow-sm rounded-2xl hover:shadow-md'
              >
                <div className='mb-4 text-4xl'>{contributor.emoji}</div>
                <h3 className='text-lg font-semibold leading-8 tracking-tight text-gray-900'>
                  {contributor.role}
                </h3>
                <p className='mt-2 text-base leading-7 text-gray-600'>
                  {contributor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
