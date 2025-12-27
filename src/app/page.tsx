'use client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { data as staticData } from '@/lib/data';

export default function Home() {
  const { user, userDetails, loading } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user && userDetails?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, userDetails, loading, router]);
  
  const handleCardClick = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };
  
  const classes = staticData.map(c => ({ id: c.id, name: c.name, subjects: c.subjects.length }));

  if (loading || !user) {
    return (
        <LoadingOverlay isLoading={true} />
    );
  }

  return (
    <>
        <LoadingOverlay isLoading={isNavigating} />
        <div className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary mb-4 animate-fade-in-up">
            Welcome, {userDetails?.name || user.email}!
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-up animation-delay-300">
            Your digital notebook, accessible anywhere.
            </p>
        </header>

        <main>
            <h2 className="font-headline text-3xl font-semibold mb-8 text-center">
            Select Your Class
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {classes.map((c) => (
                <Card 
                    key={c.id} 
                    className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95"
                    onClick={() => handleCardClick(`/student/dashboard/${c.id}`)}
                >
                    <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                        <CardTitle className="font-headline text-2xl text-foreground">
                        {c.name}
                        </CardTitle>
                        <CardDescription>{c.subjects} subjects</CardDescription>
                    </CardHeader>
                </Card>
            ))}
            </div>
        </main>
        </div>
    </>
  );
}
