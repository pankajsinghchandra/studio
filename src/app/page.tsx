'use client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassInfo {
  id: string;
  name: string;
  subjects: number;
}

export default function Home() {
  const { user, userDetails, loading } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && userDetails?.email === 'quizpankaj@gmail.com') {
      router.replace('/admin/dashboard');
    }
  }, [user, userDetails, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchClasses = async () => {
        setDataLoading(true);
        const querySnapshot = await getDocs(collection(db, 'resources'));
        const resources = querySnapshot.docs.map(doc => doc.data());
        
        const classMap = new Map<string, Set<string>>();

        resources.forEach(resource => {
          if (resource.class) {
            if (!classMap.has(resource.class)) {
              classMap.set(resource.class, new Set());
            }
            classMap.get(resource.class)!.add(resource.subject);
          }
        });
        
        const fetchedClasses: ClassInfo[] = Array.from(classMap.entries()).map(([className, subjectsSet]) => ({
          id: `class-${className.toLowerCase().replace(' ', '-')}`,
          name: `Class ${className}`,
          subjects: subjectsSet.size,
        })).sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));

        setClasses(fetchedClasses);
        setDataLoading(false);
      };
      fetchClasses();
    }
  }, [user]);
  
  const handleCardClick = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };
  
  if (loading || dataLoading || !user) {
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
            {classes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {classes.map((c) => (
                  <Card 
                      key={c.id} 
                      className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95"
                      onClick={() => handleCardClick(`/student/dashboard/${c.id.split('-')[1]}`)}
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
            ) : (
              <p className="text-center text-muted-foreground">No classes with resources found.</p>
            )}
        </main>
        </div>
    </>
  );
}
