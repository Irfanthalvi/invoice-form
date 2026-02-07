import './globals.css';
import Navbar from './navbar';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Navbar />

        {/* Toast container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

        <main className="p-8">{children}</main>
      </body>
    </html>
  );
}
