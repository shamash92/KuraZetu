import { Button } from '../../@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function RegistrationSuccessPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div className='flex justify-center'>
          <div className='flex items-center justify-center w-24 h-24 bg-green-100 rounded-full dark:bg-green-900/20'>
            <CheckCircle className='w-12 h-12 text-green-600' />
          </div>
        </div>

        <h1 className='text-3xl font-bold'>Registration Successful!</h1>

        <p className='text-muted-foreground'>
          Thank you for joining Community Tally. Your account has been created
          successfully.
        </p>

        <div className='pt-4'>
          <Button asChild className='w-full text-white bg-blue-600'>
            <a href='/'>Lets get started !</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
