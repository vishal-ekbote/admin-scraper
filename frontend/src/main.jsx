// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // Existing Tailwind CSS or custom global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);