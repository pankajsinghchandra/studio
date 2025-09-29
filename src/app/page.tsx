import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { data } from '@/lib/data';

export default function Home() {
  const classes = data.map(c => ({ id: c.id, name: c.name}));

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <header className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary mb-4 animate-fade-in-up">
          Vidyalaya Notes
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-up animation-delay-300">
          Your digital notebook, accessible anywhere.
        </p>
      </header>

      <main>
        <h2 className="font-headline text-3xl font-semibold mb-8 text-center">
          Select Your Class
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {classes.map((c) => (
            <Link href={`/${c.id}`} key={c.id} legacyBehavior>
              <a className="block transition-transform duration-300 hover:-translate-y-2">
                <Card className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full">
                  <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                    <BookOpen className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
                    <CardTitle className="font-headline text-2xl text-foreground">
                      {c.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
