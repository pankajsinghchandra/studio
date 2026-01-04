'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilePlus, Edit } from 'lucide-react';
import Link from 'next/link';
import LoadingOverlay from '@/components/loading-overlay';

export default function AdminPage() {
  const { user, loading, userDetails } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || userDetails?.email !== 'quizpankaj@gmail.com') {
        router.replace('/');
      }
    }
  }, [user, loading, router, userDetails]);

  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="font-headline text-5xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Manage your application content from here.</p>
      </header>

      <main className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/admin/dashboard">
          <Card className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group">
            <CardHeader className="flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 bg-primary/10 rounded-full mb-4 border-2 border-primary/30 group-hover:bg-primary/20 transition-colors">
                <Edit className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl text-foreground">Manage Content</CardTitle>
              <CardDescription>View, edit, filter, and delete existing resources.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/manage-content">
          <Card className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group">
            <CardHeader className="flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 bg-primary/10 rounded-full mb-4 border-2 border-primary/30 group-hover:bg-primary/20 transition-colors">
                <FilePlus className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl text-foreground">Add New Content</CardTitle>
              <CardDescription>Add new lesson plans, videos, mind maps, and more.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </main>
    </div>
  );
}

    