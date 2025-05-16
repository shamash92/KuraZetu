import { number } from 'zod';

export {};

declare global {
  interface Window {
    djangoAuthenticated: string;
    djangoUserPhoneNumber: string;
    djangoUserPollingCenterCode: string;
    djangoUserPollingCenterName: string;
    djangoUserWardNumber: number;
    djangoUserWardName: string;

    djangoUserConstName: string;
    djangoUserConstNumber: number;

    djangoUserCountyName: string;
    djangoUserCountyNumber: number;
  }
}
