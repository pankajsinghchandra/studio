import Link from 'next/link';
import { BookHeart } from 'lucide-react';
import SearchBar from '../search-bar';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block font-headline">
            Vidyalaya Notes
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
}
