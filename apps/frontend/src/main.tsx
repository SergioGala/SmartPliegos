import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { setupZodErrors } from './i18n/zod-errors';

import { ThemeProvider } from './providers/theme-provider';
import { ErrorBoundary } from './components/layout/error-boundary';
import { AuthHydrator } from './components/layout/auth-hydrator';
import App from './App';
import './index.css';
import './i18n/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

setupZodErrors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="licitaapp-theme">
              <AuthHydrator>
                <App />
                <Toaster richColors position="top-right" closeButton />
              </AuthHydrator>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);