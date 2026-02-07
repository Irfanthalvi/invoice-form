import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="text-black flex items-center px-6 py-4 space-x-6">
      <Link href="/">
        Home
      </Link>
      <Link href="/add-invoice" className="hover:text-purple-300 transition">
        Add Invoice
      </Link>
    </nav>
  );
}
