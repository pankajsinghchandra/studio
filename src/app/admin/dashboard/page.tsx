'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/loading-overlay';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'quizpankaj@gmail.com') {
        router.replace('/');
      } else {
        fetchResources();
      }
    }
  }, [user, loading, router]);

  const fetchResources = async () => {
    const querySnapshot = await getDocs(collection(db, 'resources'));
    const resourcesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setResources(resourcesList);
  };

  const handleDelete = async (resourceId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      setResources(resources.filter(r => r.id !== resourceId));
      toast({
        title: 'Success',
        description: 'Resource deleted successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete resource.',
      });
      console.error("Error deleting document: ", error);
    } finally {
        setIsDeleting(false);
    }
  };

  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isDeleting && <LoadingOverlay isLoading={true} />}
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <Button asChild>
          <Link href="/admin/manage-content">
            <PlusCircle className="mr-2" />
            Add New Content
          </Link>
        </Button>
      </header>

      <section>
        <h2 className="font-headline text-3xl font-semibold mb-6">Manage Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <Card key={resource.id} className="bg-card">
              <CardHeader>
                <CardTitle>{resource.title}</CardTitle>
                <CardDescription>{resource.type} - Class {resource.class}, {resource.subject}, Chapter {resource.chapter}</CardDescription>
              </CardHeader>
              <CardContent>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  View Resource
                </a>
              </CardContent>
              <CardFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the resource.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(resource.id)}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
