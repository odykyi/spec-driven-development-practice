import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorker from '../components/ServiceWorker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SDD Training - Learn Spec-Driven Development',
  description: 'Master the art of writing specifications and prompts for AI-assisted development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
