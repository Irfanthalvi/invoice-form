import './globals.css';
import Navbar from './navbar';
import { Toaster } from 'react-hot-toast';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
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
