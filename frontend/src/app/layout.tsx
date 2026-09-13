import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';

export const metadata: Metadata = {
  title: 'COD Flow | Enterprise Operations Platform for Cash-on-Delivery',
  description:
    'Multi-tenant operations platform for COD e-commerce sellers with storefront webhooks, call-center queues, WAHA WhatsApp automation, multi-carrier tracking, and financial remittance reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var registration of registrations) {
                    registration.unregister();
                  }
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var name of names) caches.delete(name);
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans','Cairo',sans-serif] antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
