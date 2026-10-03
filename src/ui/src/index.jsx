import './input.css';

import App from './App';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');

// One catch-all route: the route table itself stays in `routes/index.tsx`.
// A data router is what lets a page hold a navigation, which the
// specification editor needs to protect an unsaved draft.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

if (rootElement) {
  const root = ReactDOM.createRoot(document.getElementById('root'));

  root.render(<RouterProvider router={router} />);
}
