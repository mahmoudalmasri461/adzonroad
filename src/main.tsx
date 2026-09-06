import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
// Inter carries no Arabic glyphs, so Arabic would otherwise fall back to whatever the operating
// system supplies and look nothing like the rest of the product. Same weights, so the type scale
// still holds when the language changes.
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './i18n';
import { LanguageProvider } from './contexts/LanguageProvider';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Owns language, direction, the RTL style pipeline and the theme, so all four switch
        together rather than one piece at a time. */}
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
