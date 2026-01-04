'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Trash2, LayoutGrid, List, Eye, Download, Loader, X, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/loading-overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { syllabus } from '@/lib/syllabus';
import type { Resource } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import MindMap from '@/components/mind-map';


export default function AdminDashboard() {
  const { user, loading, userDetails } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [allResources, setAllResources] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || userDetails?.email !== 'quizpankaj@gmail.com') {
        router.replace('/');
      } else {
        fetchInitialResources();
         const classKeys = Object.keys(syllabus);
         setClasses(classKeys.sort((a, b) => parseInt(a) - parseInt(b)));
      }
    }
  }, [user, loading, router, userDetails]);
  
  const fetchInitialResources = async () => {
    setIsLoadingData(true);
    setHasMore(true);
    
    try {
        const first = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(20));
        const documentSnapshots = await getDocs(first);

        const resourcesList = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllResources(resourcesList); // This will hold all loaded resources
        setResources(resourcesList); // This will be the initially displayed list
        
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc);

        if (documentSnapshots.docs.length < 20) {
            setHasMore(false);
        }
    } catch (error) {
        console.error("Error fetching initial resources: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch resources.'});
    } finally {
        setIsLoadingData(false);
    }
  };
  
   const fetchMoreResources = useCallback(async () => {
    if (isFetchingMore || !hasMore || !lastVisible) return;
    setIsFetchingMore(true);

    try {
        const next = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(20));
        const documentSnapshots = await getDocs(next);

        const newResources = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setAllResources(prev => [...prev, ...newResources]);
        
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc);

        if (documentSnapshots.docs.length < 20) {
            setHasMore(false);
        }
    } catch (error) {
        console.error("Error fetching more resources: ", error);
    } finally {
        setIsFetchingMore(false);
    }
  }, [lastVisible, hasMore, isFetchingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoadingData) {
          fetchMoreResources();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [fetchMoreResources, hasMore, isFetchingMore, isLoadingData]);


  const handleDelete = async (resourceId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      // Instead of refetching all, just remove the item from the local state
      setAllResources(prev => prev.filter(r => r.id !== resourceId));
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
  
  const handleDownload = (resource: Resource) => {
    const isJson = resource.type === 'mind-map-json';
    const fileExtension = isJson ? 'json' : 'txt';
    const mimeType = isJson ? 'application/json' : 'text/plain';
    const content = resource.url;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource.title}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    
    // If filters are active, we can't reliably use infinite scroll.
    // So we disable it when any filter is selected.
    const filtersActive = !!selectedClass || !!selectedSubject || !!selectedChapter || !!selectedType;
    setHasMore(!filtersActive && lastVisible !== null && allResources.length % 20 === 0);

  }, [selectedClass, selectedSubject, selectedChapter, selectedType, allResources, lastVisible]);

  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }
  
  const isTextBased = (type: string) => type === 'lesson-plan-text' || type === 'mind-map-json';

  const renderDialogContent = () => {
    if (!selectedResource) return null;

    const { type, url } = selectedResource;
    
    if (type === 'mind-map-json') {
        try {
            const mindMapData = JSON.parse(url);
            return <MindMap data={mindMapData} />;
        } catch (e) {
            return <div className="p-6 text-destructive-foreground bg-destructive">Invalid Mind Map JSON format.</div>
        }
    }

    if (type === 'lesson-plan-text') {
         return (
            <div className="w-full h-full prose prose-sm max-w-none p-6 text-foreground bg-background rounded-lg overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: url.replace(/\n/g, '<br />') }} />
            </div>
        )
    }
    
    return null;
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {(isDeleting || isLoadingData) && <LoadingOverlay isLoading={true} />}
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          Manage Content
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-5 w-5" />
            </Button>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="font-headline text-3xl font-semibold mb-4">All Resources</h2>
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
                            <SelectItem value="lesson-plan-text">Lesson Plan (Text)</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="infographic">Infographic (Image)</SelectItem>
                            <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                            <SelectItem value="mind-map-json">Mind Map (JSON)</SelectItem>
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
                     {!isTextBased(resource.type) ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                          View Resource
                        </a>
                      ) : (
                         <div className="flex items-center gap-2">
                             <Button variant="default" size="sm" onClick={() => setSelectedResource(resource)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                            <Button variant="default" size="sm" onClick={() => handleDownload(resource)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                         </div>
                      )}
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
                        <TableHead>Type</TableHead>
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
                            <TableCell><Badge variant="outline">{resource.type}</Badge></TableCell>
                            <TableCell><Badge>{resource.class}</Badge></TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     {isTextBased(resource.type) ? (
                                        <>
                                            <Button variant="default" size="sm" onClick={() => setSelectedResource(resource)}>View</Button>
                                            <Button variant="default" size="sm" onClick={() => handleDownload(resource)}>Download</Button>
                                        </>
                                      ) : (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </a>
                                      )}
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

        <div ref={loadMoreRef} className="col-span-full py-6 text-center">
            {isFetchingMore && (
                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Loading more...</span>
                </div>
            )}
            {!hasMore && resources.length > 0 && (
                <p className="text-muted-foreground">You've reached the end.</p>
            )}
        </div>
        
        {!isLoadingData && resources.length === 0 && (
            <div className="text-center py-16 col-span-full">
                <p className="text-lg text-muted-foreground">No resources found for the selected filters.</p>
            </div>
        )}
      </section>
      
        <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
            <DialogContent 
              className="max-w-4xl w-full h-[80vh] p-0 flex flex-col"
            >
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{selectedResource?.title}</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="flex-1 w-full h-full overflow-auto">
                  {selectedResource && renderDialogContent()}
                </div>
            </DialogContent>
        </Dialog>

    </div>
  );
}

    