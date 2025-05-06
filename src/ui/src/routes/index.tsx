import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import LandingPage from '../landing-pages';
import RegistrationSuccessPage from '../auth/signup/RegistrationSuccess';
import SignupComponent from '../auth/signup/index';
import SignupForm from '../auth/signup/signupForm';
import UserDashBoard from '../dashboards/user';

export function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <h2>or</h2>
      <h1>You are most likely not logged in</h1>
      <br />

      <a href='/'>
        <button className='px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700'>
          Go home
        </button>
      </a>
    </div>
  );
}

function RoutesApp() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  useEffect(() => {
    let djangoAuth = { isAuthenticated }; // this comes from the django html template inside the script tag

    console.log(djangoAuth, 'djangoAuth');
    console.log(
      djangoAuth['isAuthenticated'] === 'true',
      'isAuthenticated true string'
    );

    console.log(
      djangoAuth['isAuthenticated'] === 'false',
      'isAuthenticated false string'
    );

    if (djangoAuth['isAuthenticated'] === 'true') {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <Routes>
      <Route path='/ui/' element={<LandingPage />} />

      {isLoggedIn ? (
        <>
          <Route path='/ui/dashboards/user/' element={<UserDashBoard />} />
        </>
      ) : (
        <>
          <Route path='/ui/signup/' element={<SignupComponent />} />
          <Route
            path='/ui/signup/accounts/:wardCode/:pollingCenterCode/'
            element={<SignupForm />}
          />
          <Route
            path='/ui/signup/accounts/registration-success/'
            element={<RegistrationSuccessPage />}
          />
        </>
      )}

      {/* 404 fallback route */}
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}

export default RoutesApp;
