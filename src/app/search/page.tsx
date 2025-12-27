'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Resource } from '@/lib/types';
import { summarizeSearchResults } from '@/ai/flows/summarize-search-results';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot } from 'lucide-react';

interface SearchResult extends Resource {
  path: string;
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (queryParam) {
      setIsLoading(true);
      setSummary('');

      const fetchResults = async () => {
        const resourcesRef = collection(db, 'resources');
        const q = query(resourcesRef);
        const querySnapshot = await getDocs(q);
        
        const allResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        
        const lowerCaseQuery = queryParam.toLowerCase();
        
        const filtered = allResources.filter(resource => 
            resource.title.toLowerCase().includes(lowerCaseQuery) ||
            resource.subject.toLowerCase().includes(lowerCaseQuery) ||
            resource.chapter.toLowerCase().includes(lowerCaseQuery)
        ).map(resource => ({
            ...resource,
            path: `/student/dashboard/${resource.class}/${resource.subject}/${resource.chapter}`
        }));
        
        setResults(filtered);
        setIsLoading(false);

        if (filtered.length > 3) {
          setIsSummarizing(true);
          const searchContentForAI = filtered.map(
            r => `[Class ${r.class} > ${r.subject}] ${r.chapter}: ${r.title}`
          );

          summarizeSearchResults({ query: queryParam, results: searchContentForAI })
            .then(output => {
              setSummary(output.summary);
            })
            .catch(console.error)
            .finally(() => setIsSummarizing(false));
        }
      };

      fetchResults();
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [queryParam]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-2">Search Results</h1>
      <p className="text-muted-foreground mb-8">
        {isLoading ? 'Searching...' : `Found ${results.length} results for "${queryParam}"`}
      </p>

      {(isSummarizing || summary) && (
        <Alert className="mb-8 bg-accent/30 border-accent">
          <Bot className="h-5 w-5 text-primary" />
          <AlertTitle className="font-headline text-lg text-primary">AI Summary</AlertTitle>
          <AlertDescription className="text-accent-foreground">
            {isSummarizing ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            ) : (
              summary
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
            {Array.from({length: 4}).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4 mb-2"/>
                        <Skeleton className="h-4 w-1/2"/>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full"/>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(result => (
            <Link href={result.path} key={result.id}>
              <Card className="hover:border-primary/80 hover:bg-card/80 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="font-headline">{result.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Class {result.class} &gt; {result.subject} &gt; {result.chapter}
                  </p>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-foreground/80 line-clamp-2">Type: {result.type.replace(/-/g, ' ')}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        !isLoading && <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No resources found matching your search.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
    return (
      <Suspense fallback={<div className="container mx-auto px-4 py-8"><h1 className="font-headline text-4xl font-bold mb-2">Searching...</h1></div>}>
        <SearchPageComponent />
      </Suspense>
    );
}
