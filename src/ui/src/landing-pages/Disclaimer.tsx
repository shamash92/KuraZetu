import { Alert, AlertDescription, AlertTitle } from '../@/components/ui/alert';

import { Shield } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className='px-6 mx-auto mt-2 max-w-7xl lg:px-8'>
      <Alert className='border-red-200 bg-red-50'>
        <Shield className='w-5 h-5 text-red-600' />
        <AlertTitle className='font-semibold text-red-600 text-md'>
          Important Disclaimer
        </AlertTitle>
        <AlertDescription className='mt-2 text-xs text-red-700'>
          This is not an official IEBC tallying system. Community Tally is a
          citizen-led initiative for transparency and does not replace official
          electoral processes or systems.
        </AlertDescription>
      </Alert>
    </div>
  );
}
