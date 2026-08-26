import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GestureBot Lab — Controle um robô com as mãos',
  description:
    'Interface experimental de rastreamento de mãos para controlar um robô articulado em tempo real.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'GestureBot Lab — Controle um robô com as mãos',
    description:
      'Mova os dedos diante da câmera e controle cabeça, braços e pernas de um robô em tempo real.',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: 'https://raw.githubusercontent.com/fa9958189/gesturebot-lab/main/public/og.png',
        width: 1672,
        height: 941,
        alt: 'Uma mão rastreada por pontos de movimento controlando o robô do GestureBot Lab.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GestureBot Lab — Controle um robô com as mãos',
    description:
      'Mova os dedos diante da câmera e controle cabeça, braços e pernas de um robô em tempo real.',
    images: ['https://raw.githubusercontent.com/fa9958189/gesturebot-lab/main/public/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
