import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WibuNews | Berita & Anime',
  description: 'RSS reader for Indonesian news and anime updates.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-[#F0F0F0] text-black font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
