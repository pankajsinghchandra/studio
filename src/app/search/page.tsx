'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { data } from '@/lib/data';
import type { Content, Lesson, Subject, ClassData } from '@/lib/types';
import { summarizeSearchResults } from '@/ai/flows/summarize-search-results';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot } from 'lucide-react';

interface SearchResult {
  path: string;
  class: ClassData;
  subject: Subject;
  lesson: Lesson;
  content: Content;
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const allNotes = useMemo(() => {
    const notes: SearchResult[] = [];
    data.forEach(classData => {
      classData.subjects.forEach(subject => {
        subject.lessons.forEach(lesson => {
          notes.push({
            path: `/${classData.id}/${subject.id}/${lesson.id}`,
            class: classData,
            subject: subject,
            lesson: lesson,
            content: lesson.content,
          });
        });
      });
    });
    return notes;
  }, []);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      setSummary('');

      const filteredResults = allNotes.filter(note =>
        note.lesson.name.toLowerCase().includes(query.toLowerCase()) ||
        note.content.description.toLowerCase().includes(query.toLowerCase()) ||
        note.subject.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);

      if (filteredResults.length > 3) {
        setIsSummarizing(true);
        const searchContentForAI = filteredResults.map(
          r => `[${r.class.name} > ${r.subject.name}] ${r.lesson.name}: ${r.content.description}`
        );

        summarizeSearchResults({ query, results: searchContentForAI })
          .then(output => {
            setSummary(output.summary);
          })
          .catch(console.error)
          .finally(() => setIsSummarizing(false));
      }
    } else {
        setResults([]);
        setIsLoading(false);
    }
  }, [query, allNotes]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-2">Search Results</h1>
      <p className="text-muted-foreground mb-8">
        {isLoading ? 'Searching...' : `Found ${results.length} results for "${query}"`}
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
                        <Skeleton className="h-4 w-full mt-2"/>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(result => (
            <Link href={result.path} key={result.path}>
              <Card className="hover:border-primary/80 hover:bg-card/80 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="font-headline">{result.lesson.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {result.class.name} &gt; {result.subject.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 line-clamp-2">{result.content.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No notes found matching your search.</p>
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
