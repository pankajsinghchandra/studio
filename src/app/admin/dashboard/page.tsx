
'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Trash2, LayoutGrid, List, Eye, Download, Loader, ArrowLeft, Pencil, Calendar, FileStack, FileText, Video, Music, Share2, ImageIcon, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/loading-overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { syllabus } from '@/lib/syllabus';
import type { Resource } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import MindMap from '@/components/mind-map';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { user, loading, userDetails } = useAuth();
  const router = useRouter();
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
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || userDetails?.email !== 'quizpankaj@gmail.com') {
        router.replace('/');
      } else {
        fetchAllResources();
         const classKeys = Object.keys(syllabus);
         setClasses(classKeys.sort((a, b) => parseInt(a) - parseInt(b)));
      }
    }
  }, [user, loading, router, userDetails]);
  
  const fetchAllResources = async () => {
    setIsLoadingData(true);
    try {
        const resourcesQuery = query(collection(db, 'resources'));
        const documentSnapshots = await getDocs(resourcesQuery);

        const resourcesList = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllResources(resourcesList);
    } catch (error) {
        console.error("Error fetching resources: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch resources.'});
    } finally {
        setIsLoadingData(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      setAllResources(prev => prev.filter(r => r.id !== resourceId));
      toast({ title: 'Success', description: 'Resource deleted successfully.', duration: 1500 });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete resource.', duration: 3000 });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleDownload = (resource: Resource) => {
    const isJson = resource.type === 'mind-map-json';
    const isText = resource.type === 'lesson-plan-text';
    
    let fileExtension = 'txt';
    let mimeType = 'text/plain';
    let content = resource.url;

    if(isJson) {
      fileExtension = 'json';
      mimeType = 'application/json';
    } else if (isText) {
      fileExtension = 'html';
      mimeType = 'text/html';
    }

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

  const filteredResources = useMemo(() => {
    let filtered = allResources;
    if (selectedClass) filtered = filtered.filter(r => String(r.class) === selectedClass);
    if (selectedSubject) filtered = filtered.filter(r => r.subject === selectedSubject);
    if (selectedChapter) filtered = filtered.filter(r => r.chapter === selectedChapter);
    if (selectedType) filtered = filtered.filter(r => r.type === selectedType);

    const sorted = [...filtered].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        
        switch (sortOrder) {
            case 'newest': return dateB.getTime() - dateA.getTime();
            case 'oldest': return dateA.getTime() - dateB.getTime();
            case 'subject': return a.subject.localeCompare(b.subject) || a.chapter.localeCompare(b.chapter);
            default: return 0;
        }
    });

    return sorted;
  }, [selectedClass, selectedSubject, selectedChapter, selectedType, allResources, sortOrder]);

  const paginatedResources = useMemo(() => {
    if (pageSize === 'all') return filteredResources;
    const limit = parseInt(pageSize);
    const startIndex = (currentPage - 1) * limit;
    return filteredResources.slice(startIndex, startIndex + limit);
  }, [filteredResources, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.ceil(filteredResources.length / parseInt(pageSize));
  }, [filteredResources, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSubject, selectedChapter, selectedType, sortOrder, pageSize]);

  useEffect(() => {
    if (selectedClass) {
        const subjectKeys = Object.keys(syllabus[selectedClass] || {});
        setSubjects(subjectKeys.sort());
    } else {
        setSubjects([]);
        setChapters([]);
    }
    if (selectedSubject) {
        const classSyllabus = syllabus[selectedClass];
        const subjectData = classSyllabus ? classSyllabus[selectedSubject] : [];
        let chapterList: string[] = [];
        if (Array.isArray(subjectData)) {
            chapterList = subjectData;
        } else if (typeof subjectData === 'object' && subjectData !== null) {
            Object.keys(subjectData).forEach(sub => {
                chapterList = [...chapterList, ...(subjectData as any)[sub]];
            });
        }
        setChapters(chapterList.sort());
    } else {
        setChapters([]);
    }
  }, [selectedClass, selectedSubject]);

  if (loading || !user) return <LoadingOverlay isLoading={true} />;
  
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
            <div className="w-full h-full overflow-y-auto p-6 bg-background rounded-lg">
                <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: url }} />
            </div>
        )
    }
    return null;
  };

  const getResourceTypeLabel = (type: string) => {
    if (type === 'mind-map-json') return 'Mind Map';
    if (type === 'translated-chapter') return 'Translated Chapter';
    if (type === 'song') return 'Song';
    if (type === 'lesson-plan-text') return 'Lesson Plan';
    if (type === 'video') return 'Video';
    if (type === 'infographic') return 'Infographic';
    if (type === 'pdf-note') return 'PDF Note';
    return type.replace(/-/g, ' ');
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'song': return <Music className="w-4 h-4" />;
      case 'lesson-plan-text': return <Pencil className="w-4 h-4" />;
      case 'mind-map-json': return <Share2 className="w-4 h-4" />;
      case 'infographic': return <ImageIcon className="w-4 h-4" />;
      case 'pdf-note':
      case 'translated-chapter': return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  }

  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'video': return 'border-l-red-500';
      case 'song': return 'border-l-purple-500';
      case 'lesson-plan-text': return 'border-l-blue-500';
      case 'mind-map-json': return 'border-l-orange-500';
      case 'infographic': return 'border-l-green-500';
      default: return 'border-l-primary';
    }
  }

  const formatDateLabel = (createdAt: any) => {
      if (!createdAt) return format(new Date(), 'dd MMM yyyy');
      try {
          const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          return format(date, 'dd MMM yyyy');
      } catch (e) {
          return format(new Date(), 'dd MMM yyyy');
      }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {(isDeleting || isLoadingData) && <LoadingOverlay isLoading={true} />}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="font-headline text-4xl font-bold text-foreground">Manage Content</h1>
            <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    <FileStack className="w-3.5 h-3.5" />
                    Total Content: {allResources.length}
                </Badge>
                {filteredResources.length !== allResources.length && (
                     <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 border-muted-foreground/30">
                        Filtered: {filteredResources.length}
                    </Badge>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
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
        <Card className="bg-card p-4 border-muted/60 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Class</Label>
                    <Select value={selectedClass || 'all'} onValueChange={v => { setSelectedClass(v === 'all' ? '' : v); setSelectedSubject(''); setSelectedChapter(''); }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Subject</Label>
                    <Select value={selectedSubject || 'all'} onValueChange={v => { setSelectedSubject(v === 'all' ? '' : v); setSelectedChapter(''); }} disabled={!selectedClass}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Chapter</Label>
                    <Select value={selectedChapter || 'all'} onValueChange={v => setSelectedChapter(v === 'all' ? '' : v)} disabled={!selectedSubject}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="All Chapters" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Chapters</SelectItem>
                             {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Resource Type</Label>
                    <Select value={selectedType || 'all'} onValueChange={v => setSelectedType(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="lesson-plan-text">Lesson Plan (Text)</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="infographic">Infographic (Image)</SelectItem>
                            <SelectItem value="mind-map-json">Mind Map (JSON)</SelectItem>
                            <SelectItem value="pdf-note">PDF Note</SelectItem>
                            <SelectItem value="translated-chapter">Translated Chapter (PDF)</SelectItem>
                            <SelectItem value="song">Song</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Sort by</Label>
                   <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="subject">Subject</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Per Page</Label>
                    <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Items per page" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                            <SelectItem value="500">500 per page</SelectItem>
                            <SelectItem value="1000">1000 per page</SelectItem>
                            <SelectItem value="all">Show All</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
      </section>

      <section className="mb-8">
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResources.map((resource: Resource & { id: string }) => (
                <Card key={resource.id} className={cn(
                  "group flex flex-col bg-card hover:bg-accent/5 transition-all duration-300 shadow-sm hover:shadow-xl border-l-4",
                  getTypeColorClass(resource.type)
                )}>
                  <CardHeader className="pb-3 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="line-clamp-2 text-lg font-headline font-bold leading-tight group-hover:text-primary transition-colors">{resource.title}</CardTitle>
                        <Badge variant="outline" className="shrink-0 text-[9px] uppercase font-bold bg-background flex items-center gap-1">
                          {getResourceTypeIcon(resource.type)}
                          {getResourceTypeLabel(resource.type)}
                        </Badge>
                    </div>
                    <CardDescription className="flex flex-col gap-1 mt-2">
                        <span className="text-xs font-bold text-primary/80">Class {resource.class} • {resource.subject}</span>
                        <span className="text-[11px] flex items-center text-muted-foreground/80">
                            <Calendar className="w-3 h-3 mr-1" />
                            Added: {formatDateLabel(resource.createdAt)}
                        </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pt-4 pb-4 px-6">
                     <div className="flex flex-wrap gap-2">
                        {isTextBased(resource.type) ? (
                            <Button variant="secondary" size="sm" className="h-8 shadow-sm" onClick={() => setSelectedResource(resource)}><Eye className="mr-2 h-3.5 w-3.5" /> View</Button>
                        ) : (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm" className="h-8 shadow-sm"><Eye className="mr-2 h-3.5 w-3.5" /> View</Button>
                            </a>
                        )}
                        <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:border-primary/50" asChild>
                            <Link href={`/admin/edit-content/${resource.id}`}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</Link>
                        </Button>
                        {isTextBased(resource.type) && (
                            <Button variant="outline" size="sm" className="h-8 border-primary/20" onClick={() => handleDownload(resource)}><Download className="mr-2 h-3.5 w-3.5" /> Download</Button>
                        )}
                     </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-6">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-9 w-full border-t border-border/60 rounded-none mt-2 font-semibold">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Resource
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the resource.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(resource.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Permanently</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
        ) : (
          <Card className="overflow-hidden border-border/60 shadow-md">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-bold">Title & Date</TableHead>
                        <TableHead className="font-bold">Path</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedResources.map((resource: Resource & { id: string }) => (
                         <TableRow key={resource.id} className="hover:bg-accent/5">
                            <TableCell className="py-3">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm line-clamp-1">{resource.title}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                                        <Calendar className="w-2.5 h-2.5 mr-1" />
                                        {formatDateLabel(resource.createdAt)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/5 text-primary border-primary/10">Cl {resource.class}</Badge>
                                    <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">{resource.subject}</span>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] py-0 border-muted-foreground/20">{getResourceTypeLabel(resource.type)}</Badge></TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                     {isTextBased(resource.type) ? (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => setSelectedResource(resource)}><Eye className="h-4 w-4" /></Button>
                                      ) : (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Eye className="h-4 w-4" /></Button></a>
                                      )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" asChild><Link href={`/admin/edit-content/${resource.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Delete Resource?</AlertDialogTitle></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(resource.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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

        {/* Pagination Controls */}
        {pageSize !== 'all' && filteredResources.length > parseInt(pageSize) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
                <p className="text-sm text-muted-foreground font-medium">
                    Showing <span className="text-foreground">{((currentPage - 1) * parseInt(pageSize)) + 1}</span> to <span className="text-foreground">{Math.min(currentPage * parseInt(pageSize), filteredResources.length)}</span> of <span className="text-foreground">{filteredResources.length}</span> resources
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Logic to show a window of pages
                            let pageNum = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 3 + i + 1;
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }
                            return (
                                <Button 
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="h-8 w-8 p-0"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        )}

        {isLoadingData && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-primary" /></div>}
        {!isLoadingData && filteredResources.length === 0 && (
            <div className="text-center py-24 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                <p className="text-lg text-muted-foreground font-medium">No resources found matching your filters.</p>
                <Button variant="link" onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); setSelectedType(''); }}>Clear all filters</Button>
            </div>
        )}
      </section>
      
        <Dialog open={!!selectedResource} onOpenChange={o => !o && setSelectedResource(null)}>
            <DialogContent className="max-w-4xl w-full h-[85vh] p-0 flex flex-col border-none shadow-2xl">
                <div className="p-3 border-b bg-card flex justify-between items-center shrink-0 rounded-t-lg">
                    <h3 className="font-bold text-sm truncate px-4 text-primary">{selectedResource?.title}</h3>
                </div>
                <div className="flex-1 overflow-auto bg-background">{selectedResource && renderDialogContent()}</div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
