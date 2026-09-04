
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Resource } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResult extends Resource {
  path: string;
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (queryParam) {
      setIsLoading(true);

      const fetchResults = async () => {
        try {
          const resourcesRef = collection(db, 'resources');
          const q = query(resourcesRef);
          const querySnapshot = await getDocs(q);
          
          const allResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
          
          const lowerCaseQuery = queryParam.toLowerCase();
          
          // NORMAL SEARCH LOGIC: No AI used here to save quota
          const filtered = allResources.filter(resource => 
              resource.title.toLowerCase().includes(lowerCaseQuery) ||
              resource.subject.toLowerCase().includes(lowerCaseQuery) ||
              resource.chapter.toLowerCase().includes(lowerCaseQuery) ||
              resource.class.toLowerCase().includes(lowerCaseQuery)
          ).map(resource => ({
              ...resource,
              path: `/student/dashboard/${resource.class}/${encodeURIComponent(resource.subject)}/${encodeURIComponent(resource.chapter)}`
          }));
          
          setResults(filtered);
        } catch (error) {
          console.error("Search error: ", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchResults();
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [queryParam]);

  const getResourceTypeLabel = (type: string) => {
    if (type === 'mind-map-json') return 'Mind Map';
    if (type === 'translated-chapter') return 'Translated Chapter';
    if (type === 'song') return 'Song';
    if (type === 'lesson-plan-text') return 'Lesson Plan';
    return type.replace(/-/g, ' ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-2 text-foreground">Search Results</h1>
      <p className="text-muted-foreground mb-8">
        {isLoading ? 'Searching...' : `Found ${results.length} results for "${queryParam}"`}
      </p>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4 mb-2"/>
                        <Skeleton className="h-4 w-1/2"/>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-1/3"/>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map(result => (
            <Link href={result.path} key={result.id}>
              <Card className="hover:border-primary/80 hover:bg-accent/5 transition-all duration-300 hover:shadow-lg active:scale-[0.98] h-full group">
                <CardHeader>
                  <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors line-clamp-2">{result.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Class {result.class} &bull; {result.subject} &bull; {result.chapter}
                  </div>
                </CardHeader>
                <CardContent>
                   <span className="text-[10px] font-bold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                      {getResourceTypeLabel(result.type)}
                   </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        !isLoading && <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <p className="text-lg text-muted-foreground">No resources found matching your search.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
    return (
      <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center"><h1 className="font-headline text-4xl font-bold mb-2">Searching...</h1></div>}>
        <SearchPageComponent />
      </Suspense>
    );
}
