import './globals.css';

export const metadata = {
  title: 'TaskFlow | Notion-Inspired Project Management Platform',
  description: 'Streamlined workspace, project planning, Notion-style Kanban board, and real-time team collaboration.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#191919] text-[#e3e3e3] antialiased min-h-screen selection:bg-[#2d3748] selection:text-white">
        {children}
      </body>
    </html>
  );
}
