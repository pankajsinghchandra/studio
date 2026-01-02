'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Trash2, LayoutGrid, List } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/loading-overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { syllabus } from '@/lib/syllabus';
import type { Resource } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [allResources, setAllResources] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');


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
    setIsLoadingData(true);
    const querySnapshot = await getDocs(collection(db, 'resources'));
    const resourcesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllResources(resourcesList);
    setResources(resourcesList);
    
    const classKeys = Object.keys(syllabus);
    setClasses(classKeys.sort((a, b) => parseInt(a) - parseInt(b)));
    
    setIsLoadingData(false);
  };

  const handleDelete = async (resourceId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      await fetchResources();
      toast({
        title: 'Success',
        description: 'Resource deleted successfully.',
        duration: 1500,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete resource.',
        duration: 3000,
      });
      console.error("Error deleting document: ", error);
    } finally {
        setIsDeleting(false);
    }
  };

  useEffect(() => {
    let filtered = allResources;

    if (selectedClass) {
        filtered = filtered.filter(r => r.class === selectedClass);
        const subjectKeys = Object.keys(syllabus[selectedClass as keyof typeof syllabus] || {});
        setSubjects(subjectKeys.sort());
    } else {
        setSubjects([]);
        setChapters([]);
    }

    if (selectedSubject) {
        filtered = filtered.filter(r => r.subject === selectedSubject);
        const classSyllabus = syllabus[selectedClass as keyof typeof syllabus];
        const subjectSyllabus = classSyllabus ? (classSyllabus as any)[selectedSubject] : [];
        const chapterKeys = Array.isArray(subjectSyllabus) ? subjectSyllabus : Object.keys(subjectSyllabus || {});
        setChapters(chapterKeys.sort());
    } else {
        setChapters([]);
    }
    
    if (selectedChapter) {
        filtered = filtered.filter(r => r.chapter === selectedChapter);
    }
    
    if (selectedType) {
        filtered = filtered.filter(r => r.type === selectedType);
    }


    setResources(filtered);
  }, [selectedClass, selectedSubject, selectedChapter, selectedType, allResources]);

  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {(isDeleting || isLoadingData) && <LoadingOverlay isLoading={true} />}
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-5 w-5" />
            </Button>
            <Button asChild>
              <Link href="/admin/manage-content">
                <PlusCircle className="mr-2" />
                Add New Content
              </Link>
            </Button>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="font-headline text-3xl font-semibold mb-4">Manage Notes</h2>
        <Card className="bg-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <Label htmlFor="class-filter">Class</Label>
                    <Select value={selectedClass || 'all'} onValueChange={value => { setSelectedClass(value === 'all' ? '' : value); setSelectedSubject(''); setSelectedChapter(''); }}>
                        <SelectTrigger id="class-filter"><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="subject-filter">Subject</Label>
                    <Select value={selectedSubject || 'all'} onValueChange={value => { setSelectedSubject(value === 'all' ? '' : value); setSelectedChapter(''); }} disabled={!selectedClass}>
                        <SelectTrigger id="subject-filter"><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="chapter-filter">Chapter</Label>
                    <Select value={selectedChapter || 'all'} onValueChange={(value) => setSelectedChapter(value === 'all' ? '' : value)} disabled={!selectedSubject}>
                        <SelectTrigger id="chapter-filter"><SelectValue placeholder="Filter by Chapter" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Chapters</SelectItem>
                             {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="type-filter">Resource Type</Label>
                    <Select value={selectedType || 'all'} onValueChange={value => setSelectedType(value === 'all' ? '' : value)}>
                        <SelectTrigger id="type-filter"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="lesson-plan-pdf">Lesson Plan (PDF)</SelectItem>
                            <SelectItem value="lesson-plan-image">Lesson Plan (Image)</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="infographic">Infographic (Image)</SelectItem>
                            <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                            <SelectItem value="pdf-note">PDF Note</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
      </section>

      <section>
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource: Resource & { id: string }) => (
                <Card key={resource.id} className="bg-card flex flex-col">
                  <CardHeader>
                    <CardTitle>{resource.title}</CardTitle>
                    <CardDescription>{resource.type} - Class {resource.class}, {resource.subject}, Chapter {resource.chapter}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
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
        ) : (
          <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {resources.map((resource: Resource & { id: string }) => (
                         <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.title}</TableCell>
                            <TableCell><Badge variant="secondary">{resource.subject}</Badge></TableCell>
                            <TableCell>{resource.chapter}</TableCell>
                            <TableCell><Badge>{resource.class}</Badge></TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </a>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
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
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </Card>
        )}
        {!isLoadingData && resources.length === 0 && (
            <div className="text-center py-16 col-span-full">
                <p className="text-lg text-muted-foreground">No resources found for the selected filters.</p>
            </div>
        )}
      </section>
    </div>
  );
}
