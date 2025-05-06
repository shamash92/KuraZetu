import { Route, Routes } from 'react-router-dom';

import LandingPage from '../landing-pages/index';
import React from 'react';
import RegistrationSuccessPage from '../auth/signup/RegistrationSuccess';
import SignupComponent from '../auth/signup/index';
import SignupForm from '../auth/signup/signupForm';

function AuthRoutes() {
  return (
    <Routes>
      <Route path='/ui/' element={<LandingPage />} />
      <Route path='/ui/signup/' element={<SignupComponent />} />
      <Route
        path='/ui/signup/accounts/:wardCode/:pollingCenterCode/'
        element={<SignupForm />}
      />
      <Route
        path='/ui/signup/accounts/registration-success/'
        element={<RegistrationSuccessPage />}
      />
    </Routes>
  );
}

export default AuthRoutes;
