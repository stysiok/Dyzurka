import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from './components/ServiceWorkerRegister';

export const metadata: Metadata = { title: 'Mirhi', description: 'Harmonogram terapii pacjentów', manifest: '/manifest.json', appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Mirhi' }, icons: { apple: '/icons/icon-192x192.png' } };
export const viewport: Viewport = { themeColor: '#0a84ff', width: 'device-width', initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pl"><body><ServiceWorkerRegister />{children}</body></html>; }
