import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './max-app.css';
import MaxApp from './MaxApp.jsx';

createRoot(document.getElementById('max-root')).render(
  <StrictMode>
    <MaxApp />
  </StrictMode>,
);
