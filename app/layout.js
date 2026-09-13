import './globals.css';

export const metadata = {
  title: 'TaskFlow | High-Performance SaaS Project Management Platform',
  description: 'Streamlined workspace, project planning, Kanban board, and real-time team collaboration for modern engineering teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f17] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
