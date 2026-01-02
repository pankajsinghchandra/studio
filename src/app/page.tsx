'use client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import { Award, Book, Briefcase, GraduationCap, PenTool, School, Dna, Atom, History, Microscope, Languages, Globe, Calculator, FlaskConical, Palette } from 'lucide-react';
import { syllabus } from '@/lib/syllabus';


interface ClassInfo {
  id: string;
  name: string;
  subjects: number;
  icon: React.ElementType;
}

const classIcons = [School, GraduationCap, Award, Book, Briefcase, PenTool, Dna, Atom, History, Microscope, Languages, Globe, Calculator, FlaskConical, Palette ];

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
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const classKeys = Object.keys(syllabus);
      
      const fetchedClasses: ClassInfo[] = classKeys.map((classKey, index) => {
        const subjects = Object.keys(syllabus[classKey as keyof typeof syllabus]);
        return {
          id: classKey,
          name: `Class ${classKey}`,
          subjects: subjects.length,
          icon: classIcons[index % classIcons.length],
        };
      }).sort((a, b) => parseInt(a.id) - parseInt(b.id));

      setClasses(fetchedClasses);
      setDataLoading(false);
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
            Apni class select karo.
            </h2>
            {classes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {classes.map((c) => (
                  <Card 
                      key={c.id} 
                      className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group"
                      onClick={() => handleCardClick(`/student/dashboard/${c.id}`)}
                  >
                      <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                           <div className="p-4 bg-primary/10 rounded-full mb-4 border-2 border-primary/30 group-hover:bg-primary/20 transition-colors">
                              <c.icon className="w-8 h-8 text-primary" />
                           </div>
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
