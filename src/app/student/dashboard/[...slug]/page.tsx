'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { data as staticData } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { Resource } from '@/lib/types';
import Breadcrumb from '@/components/breadcrumb';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingOverlay from '@/components/loading-overlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Video, ImageIcon, BrainCircuit, BookOpen } from 'lucide-react';

const getIcon = (type: Resource['type']) => {
    switch (type) {
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
            return <BookOpen className="w-8 h-8 text-primary/80 mt-1" />;
    }
};

export default function DynamicPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, userDetails, loading: authLoading } = useAuth();
    
    const [pathSegments, setPathSegments] = useState<string[]>([]);
    const [pageType, setPageType] = useState<'class' | 'subject' | 'chapter' | 'unknown'>('unknown');
    const [breadcrumbItems, setBreadcrumbItems] = useState<{ href: string; label: string }[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cards, setCards] = useState<{ id: string, name: string, description: string, path: string }[]>([]);

    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const segments = pathname.split('/').filter(Boolean).slice(2); // remove 'student', 'dashboard'
        setPathSegments(segments);
        
        if (segments.length === 1) setPageType('class');
        else if (segments.length === 2) setPageType('subject');
        else if (segments.length === 3) setPageType('chapter');
        else setPageType('unknown');

    }, [pathname]);

    useEffect(() => {
        if (pageType === 'unknown' || authLoading) return;
        setIsLoading(true);

        const [classId, subjectId, chapterId] = pathSegments;
        
        const classData = staticData.find(c => c.id === classId);
        if (!classData) { router.push('/'); return; }

        const baseBreadcrumbs = [
            { href: '/', label: 'Home' },
            { href: `/student/dashboard/${classId}`, label: classData.name },
        ];

        if (pageType === 'class') {
            setTitle(classData.name);
            setDescription('Select a subject to explore.');
            setCards(classData.subjects.map(s => ({
                id: s.id,
                name: s.name,
                description: `${s.lessons.length} chapters`,
                path: `/student/dashboard/${classId}/${s.id}`
            })));
            setBreadcrumbItems(baseBreadcrumbs);
            setIsLoading(false);
        }

        if (pageType === 'subject') {
            const subjectData = classData.subjects.find(s => s.id === subjectId);
            if (!subjectData) { router.push('/'); return; }
            setTitle(subjectData.name);
            setDescription('Select a chapter to start learning.');
            setCards(subjectData.lessons.map(l => ({
                id: l.id,
                name: l.name,
                description: l.content[0]?.description || 'View resources for this chapter.',
                path: `/student/dashboard/${classId}/${subjectId}/${l.id}`
            })));
            setBreadcrumbItems([...baseBreadcrumbs, { href: `/student/dashboard/${classId}/${subjectId}`, label: subjectData.name }]);
            setIsLoading(false);
        }

        if (pageType === 'chapter') {
            const subjectData = classData.subjects.find(s => s.id === subjectId);
            const lessonData = subjectData?.lessons.find(l => l.id === chapterId);
            if (!subjectData || !lessonData) { router.push('/'); return; }

            setTitle(lessonData.name);
            setDescription('Available resources for this chapter.');
            setBreadcrumbItems([
                ...baseBreadcrumbs,
                { href: `/student/dashboard/${classId}/${subjectId}`, label: subjectData.name },
                { href: `/student/dashboard/${classId}/${subjectId}/${chapterId}`, label: lessonData.name }
            ]);

            const fetchResources = async () => {
                const q = query(collection(db, "resources"),
                    where("class", "==", classData.name.replace('Class ', '')),
                    where("subject", "==", subjectData.name),
                    where("chapter", "==", lessonData.name)
                );
                const querySnapshot = await getDocs(q);
                const fetchedResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[];
                setResources(fetchedResources);
                setIsLoading(false);
            };
            fetchResources();
        }

    }, [pageType, pathSegments, authLoading, router]);

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

                {pageType !== 'chapter' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cards.map(card => (
                            <Card 
                                key={card.id} 
                                className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95"
                                onClick={() => handleCardClick(card.path)}
                            >
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl text-foreground">{card.name}</CardTitle>
                                    <CardDescription>{card.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
                
                {pageType === 'chapter' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources
                         .filter(resource => {
                             if ((resource.type === 'lesson-plan-pdf' || resource.type === 'lesson-plan-word') && userDetails?.role !== 'teacher') {
                                 return false;
                             }
                             return true;
                         })
                         .map(resource => (
                            <Card key={resource.id} className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95" onClick={() => handleResourceClick(resource)}>
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        {getIcon(resource.type)}
                                        <div>
                                            <CardTitle className="font-headline text-xl text-foreground">{resource.title}</CardTitle>
                                            <CardDescription className="mt-1 capitalize">{resource.type.replace(/-/g, ' ')}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                         {resources.length === 0 && <p>No resources found for this chapter.</p>}
                    </div>
                )}
            </div>
            
            {/* Video Dialog */}
            <Dialog open={!!selectedVideoUrl} onOpenChange={() => setSelectedVideoUrl(null)}>
                <DialogContent className="max-w-4xl w-full h-auto p-0">
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

            {/* Image Dialog */}
            <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
                <DialogContent className="max-w-4xl w-full p-0">
                     <DialogHeader className="p-4">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <img src={selectedImageUrl || ''} alt="Resource" className="w-full h-auto max-h-[80vh] object-contain" />
                </DialogContent>
            </Dialog>
        </>
    );
}
