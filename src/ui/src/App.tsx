import React, { createContext, useContext } from 'react';

import RoutesApp from './routes';

let djangoAuth = { djangoAuthenticated: window.djangoAuthenticated || 'false' }; //  this comes from the django html template inside the script tag

// console.log(djangoAuth, 'djangoAuth in App.tsx');
// console.log(
//   window.djangoAuthenticated,
//   'window.djangoAuthenticated in App.tsx'
// );

let isAuthenticated: boolean =
  djangoAuth['djangoAuthenticated'] === 'true' ? true : false;

// console.log(isAuthenticated, 'isAuthenticated in App.tsx');

// console.log(typeof isAuthenticated, 'isAuthenticated type in App.tsx');

// Create a context
const AuthContext = createContext<boolean>(false);

// Create a provider component
function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={isAuthenticated}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

function App() {
  return (
    <div className='flex flex-col items-center justify-start min-h-screen bg-gray-50'>
      <AuthProvider>
        <RoutesApp />
      </AuthProvider>
    </div>
  );
}

export default App;
