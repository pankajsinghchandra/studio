'use client';

import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchBar() {
  const router = useRouter();

  function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const input = form.elements.namedItem('search') as HTMLInputElement;
    const query = input.value;
    if (query) {
      router.push(`/search?q=${query}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        name="search"
        placeholder="Search for notes..."
        className="w-full pl-9"
      />
    </form>
  );
}
