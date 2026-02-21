import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tg-app.css';
import TgApp from './TgApp.jsx';

createRoot(document.getElementById('tg-root')).render(
  <StrictMode>
    <TgApp />
  </StrictMode>,
);
