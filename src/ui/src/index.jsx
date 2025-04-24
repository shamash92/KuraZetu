import './input.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(document.getElementById('root'));

  root.render(
    <div>
      <h1>Hello world!</h1>
    </div>
  );
}
