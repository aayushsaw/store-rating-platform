import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import { store } from '@/app/store';
import { injectStore } from '@/lib/api';
import { App } from '@/App';
import '@/index.css';

// Inject the Redux store into the Axios interceptor to avoid circular deps
injectStore(store);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
