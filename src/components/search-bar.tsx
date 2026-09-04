
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Resource } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Suggestion extends Resource {
  path: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const resourcesRef = collection(db, 'resources');
        const querySnapshot = await getDocs(query(resourcesRef));
        
        const allResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        
        const lowerCaseQuery = searchTerm.toLowerCase();
        
        const filtered = allResources.filter(resource => 
            resource.title.toLowerCase().includes(lowerCaseQuery) ||
            resource.subject.toLowerCase().includes(lowerCaseQuery) ||
            resource.chapter.toLowerCase().includes(lowerCaseQuery) ||
            resource.class.toLowerCase().includes(lowerCaseQuery)
        ).map(resource => ({
            ...resource,
            path: `/student/dashboard/${resource.class}/${encodeURIComponent(resource.subject)}/${encodeURIComponent(resource.chapter)}`
        })).slice(0, 8); // Showing up to 8 suggestions for a modern feel
        
        setSuggestions(filtered);
      } catch (error) {
        console.error("Search error: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  const handleSelect = (path: string) => {
    setSearchTerm('');
    setShowSuggestions(false);
    router.push(path);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={onSubmit} className="relative w-full group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search for notes (e.g. Science Class 6)..."
          className="w-full pl-9 pr-10 rounded-full bg-accent/20 border-accent/30 focus:bg-background transition-all shadow-sm"
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </form>

      {/* Modern YouTube-like Search Suggestions Dropdown */}
      {showSuggestions && (searchTerm.length >= 3) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Suggestions</span>
            {isLoading && <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="p-1">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s.path)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors text-left group"
                  >
                    <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Class {s.class}</span>
                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                        <span>{s.subject}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </button>
                ))}
                <button
                  onClick={onSubmit}
                  className="w-full p-3 text-center text-xs font-medium text-primary hover:bg-primary/5 border-t mt-1 transition-colors"
                >
                  See all results for "{searchTerm}"
                </button>
              </div>
            ) : !isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No exact matches found</p>
                <p className="text-[10px]">Try different keywords or check spelling</p>
              </div>
            ) : (
              <div className="p-12 text-center">
                 <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
