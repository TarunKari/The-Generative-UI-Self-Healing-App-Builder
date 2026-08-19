import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generative UI Builder - AI-Powered Self-Healing Apps',
  description: 'Build, deploy, and visually debug full web applications in real-time using AI vision and self-healing loops.',
  keywords: ['AI', 'UI Builder', 'Generative', 'Vision', 'Self-Healing', 'React', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
