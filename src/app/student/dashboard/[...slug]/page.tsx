'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { Resource } from '@/lib/types';
import Breadcrumb from '@/components/breadcrumb';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingOverlay from '@/components/loading-overlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Video, ImageIcon, BrainCircuit, BookOpen, Folder, File, ChevronRight, School, Book, FlaskConical, Languages, Landmark, Calculator, Palette } from 'lucide-react';

const getIcon = (itemType: 'class' | 'subject' | 'chapter' | 'resource', name?: string, resourceType?: string) => {
    const nameLower = name?.toLowerCase() || '';
    if (itemType === 'class') return <School className="w-8 h-8 text-primary" />;
    if (itemType === 'subject') {
        if (nameLower.includes('math')) return <Calculator className="w-8 h-8 text-primary" />;
        if (nameLower.includes('science')) return <FlaskConical className="w-8 h-8 text-primary" />;
        if (nameLower.includes('social')) return <Landmark className="w-8 h-8 text-primary" />;
        if (nameLower.includes('hindi')) return <Languages className="w-8 h-8 text-primary" />;
        if (nameLower.includes('english')) return <Book className="w-8 h-8 text-primary" />;
        if (nameLower.includes('computer')) return <Palette className="w-8 h-8 text-primary" />;
        return <Folder className="w-8 h-8 text-primary" />;
    }
    if (itemType === 'chapter') return <BookOpen className="w-8 h-8 text-primary" />;

    // Resource icons
    switch (resourceType) {
        case 'lesson-plan-pdf':
        case 'lesson-plan-word':
        case 'pdf-note':
            return <FileText className="w-8 h-8 text-primary/80 mt-1" />;
        case 'video':
            return <Video className="w-8 h-8 text-primary/80 mt-1" />;
        case 'infographic':
            return <ImageIcon className="w-8 h-8 text-primary/80 mt-1" />;
        case 'mind-map':
            return <BrainCircuit className="w-8 h-8 text-primary/80 mt-1" />;
        default:
            return <File className="w-8 h-8 text-primary/80 mt-1" />;
    }
};

interface CardData {
    id: string;
    name: string;
    description: string;
    path: string;
}

export default function DynamicPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, userDetails, loading: authLoading } = useAuth();
    
    const pathSegments = useMemo(() => pathname.split('/').filter(Boolean).slice(2), [pathname]);
    const pageType = useMemo(() => {
        if (pathSegments.length === 1) return 'class';
        if (pathSegments.length === 2) return 'subject';
        if (pathSegments.length === 3) return 'chapter';
        return 'unknown';
    }, [pathSegments]);

    const [breadcrumbItems, setBreadcrumbItems] = useState<{ href: string; label: string }[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cards, setCards] = useState<CardData[]>([]);

    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (pageType === 'unknown' || authLoading || !user) return;
        setIsLoading(true);

        const [classId, subjectId, chapterId] = pathSegments.map(decodeURIComponent);

        const fetchFirestoreData = async () => {
            const className = classId;
            const subjectName = subjectId;
            const chapterName = chapterId;

            const baseBreadcrumbs = [
                { href: '/', label: 'Home' },
                { href: `/student/dashboard/${className}`, label: `Class ${className}` },
            ];

            try {
                if (pageType === 'class') {
                    const q = query(collection(db, "resources"), where("class", "==", className));
                    const querySnapshot = await getDocs(q);
                    const subjectMap = new Map<string, Set<string>>();
                    querySnapshot.forEach(doc => {
                        const resource = doc.data();
                        if (!subjectMap.has(resource.subject)) {
                            subjectMap.set(resource.subject, new Set());
                        }
                        subjectMap.get(resource.subject)!.add(resource.chapter);
                    });

                    setTitle(`Class ${className}`);
                    setDescription('Select a subject to explore.');
                    setCards(Array.from(subjectMap.entries()).map(([subject, chapters]) => ({
                        id: subject,
                        name: subject,
                        description: `${chapters.size} chapters`,
                        path: `/student/dashboard/${className}/${encodeURIComponent(subject)}`
                    })));
                    setBreadcrumbItems(baseBreadcrumbs);
                }

                if (pageType === 'subject') {
                    const q = query(collection(db, "resources"), 
                        where("class", "==", className), 
                        where("subject", "==", subjectName)
                    );
                    const querySnapshot = await getDocs(q);
                    const chapters = new Set<string>();
                    querySnapshot.forEach(doc => chapters.add(doc.data().chapter));

                    setTitle(subjectName);
                    setDescription('Select a chapter to start learning.');
                    setCards(Array.from(chapters).map(chapter => ({
                        id: chapter,
                        name: chapter,
                        description: 'View resources',
                        path: `/student/dashboard/${className}/${encodeURIComponent(subjectName)}/${encodeURIComponent(chapter)}`
                    })));
                    setBreadcrumbItems([...baseBreadcrumbs, { href: `/student/dashboard/${className}/${encodeURIComponent(subjectName)}`, label: subjectName }]);
                }

                if (pageType === 'chapter') {
                    const q = query(collection(db, "resources"),
                        where("class", "==", className),
                        where("subject", "==", subjectName),
                        where("chapter", "==", chapterName)
                    );
                    const querySnapshot = await getDocs(q);
                    const fetchedResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[];
                    
                    setTitle(chapterName);
                    setDescription('Available resources for this chapter.');
                    setResources(fetchedResources);
                    setBreadcrumbItems([
                        ...baseBreadcrumbs,
                        { href: `/student/dashboard/${className}/${encodeURIComponent(subjectName)}`, label: subjectName },
                        { href: `/student/dashboard/${className}/${encodeURIComponent(subjectName)}/${encodeURIComponent(chapterName)}`, label: chapterName }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching data from Firestore: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFirestoreData();

    }, [pageType, pathSegments, authLoading, user]);

    const handleCardClick = (path: string) => {
        setIsNavigating(true);
        router.push(path);
    };
    
    const handleResourceClick = (resource: Resource) => {
        if (resource.type === 'video') {
            if (resource.url.includes('youtube.com') || resource.url.includes('youtu.be')) {
                const videoId = resource.url.split('v=')[1]?.split('&')[0] || resource.url.split('/').pop();
                setSelectedVideoUrl(`https://www.youtube.com/embed/${videoId}`);
            } else {
                 window.open(resource.url, '_blank');
            }
        } else if (resource.type === 'infographic' || resource.type === 'mind-map') {
            setSelectedImageUrl(resource.url);
        } else {
            window.open(resource.url, '_blank');
        }
    };
    
    if (authLoading || isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    return (
        <>
            <LoadingOverlay isLoading={isNavigating} />
            <div className="container mx-auto px-4 py-8">
                <Breadcrumb items={breadcrumbItems} />
                <header className="mb-8">
                    <h1 className="font-headline text-4xl font-bold text-foreground">{title}</h1>
                    <p className="text-lg text-muted-foreground">{description}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageType !== 'chapter' && (
                     cards.length > 0 ? (
                            cards.map(card => (
                                <Card 
                                    key={card.id} 
                                    className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group"
                                    onClick={() => handleCardClick(card.path)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <div className='flex items-center gap-4'>
                                          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                            {getIcon(pageType === 'class' ? 'subject' : 'chapter', card.name)}
                                          </div>
                                          <div>
                                            <CardTitle className="font-headline text-xl text-foreground">{card.name}</CardTitle>
                                            <CardDescription>{card.description}</CardDescription>
                                          </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </CardHeader>
                                </Card>
                            ))
                    ) : <p className="col-span-full text-center text-muted-foreground">No items found.</p>
                )}
                
                {pageType === 'chapter' && (
                    <>
                        {resources
                         .filter(resource => !(userDetails?.role !== 'teacher' && (resource.type === 'lesson-plan-pdf' || resource.type === 'lesson-plan-word')))
                         .map(resource => (
                            <Card key={resource.id} className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group" onClick={() => handleResourceClick(resource)}>
                                <CardHeader className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                            {getIcon('resource', undefined, resource.type)}
                                        </div>
                                        <div>
                                            <CardTitle className="font-headline text-xl text-foreground leading-tight">{resource.title}</CardTitle>
                                            <CardDescription className="mt-1 capitalize">{resource.type.replace(/-/g, ' ')}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                         {resources.length === 0 && <p className="col-span-full text-center text-muted-foreground">No resources found for this chapter.</p>}
                    </>
                )}
                </div>
            </div>
            
            <Dialog open={!!selectedVideoUrl} onOpenChange={() => setSelectedVideoUrl(null)}>
                <DialogContent className="max-w-4xl w-full h-auto p-0 bg-card">
                    <div className="aspect-video">
                        <iframe
                            src={selectedVideoUrl || ''}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
                <DialogContent className="max-w-4xl w-full p-0 bg-card">
                     <DialogHeader className="p-4">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                      <img src={selectedImageUrl || ''} alt="Resource" className="w-full h-auto max-h-[80vh] object-contain rounded-md" />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
