
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
import { 
    FileText, Video, ImageIcon, BrainCircuit, BookOpen, Folder, File, ChevronRight, 
    School, Book, FlaskConical, Languages, Landmark, Calculator, Palette, Dna, Atom, 
    Globe, Scroll, Milestone, Users, Drama, Leaf
} from 'lucide-react';
import { syllabus } from '@/lib/syllabus';

const getIcon = (itemType: 'class' | 'subject' | 'chapter' | 'resource', name?: string, resourceType?: string) => {
    const nameLower = name?.toLowerCase() || '';
    const iconProps = { className: "w-8 h-8 text-primary drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]" };
    const resourceIconProps = { className: "w-8 h-8 text-primary/80 mt-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]" };

    if (itemType === 'class') return <School {...iconProps} />;
    if (itemType === 'subject') {
        if (nameLower.includes('math')) return <Calculator {...iconProps} />;
        if (nameLower.includes('science')) return <FlaskConical {...iconProps} />;
        if (nameLower.includes('biology')) return <Dna {...iconProps} />;
        if (nameLower.includes('physics')) return <Atom {...iconProps} />;
        if (nameLower.includes('chemistry')) return <FlaskConical {...iconProps} />;
        if (nameLower.includes('social science') || nameLower.includes('civics')) return <Users {...iconProps} />;
        if (nameLower.includes('history')) return <Landmark {...iconProps} />;
        if (nameLower.includes('geography')) return <Globe {...iconProps} />;
        if (nameLower.includes('hindi')) return <Scroll {...iconProps} />;
        if (nameLower.includes('english')) return <Book {...iconProps} />;
        if (nameLower.includes('sanskrit')) return <Drama {...iconProps} />;
        if (nameLower.includes('computer')) return <Palette {...iconProps} />;
        if (nameLower.includes('environmental')) return <Leaf {...iconProps} />;
        return <Folder {...iconProps} />;
    }
    if (itemType === 'chapter') return <BookOpen {...iconProps} />;

    // Resource icons
    switch (resourceType) {
        case 'lesson-plan-pdf':
        case 'lesson-plan-word':
        case 'pdf-note':
            return <FileText {...resourceIconProps} />;
        case 'video':
            return <Video {...resourceIconProps} />;
        case 'infographic':
            return <ImageIcon {...resourceIconProps} />;
        case 'mind-map':
            return <BrainCircuit {...resourceIconProps} />;
        default:
            return <File {...resourceIconProps} />;
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

        const fetchData = async () => {
            const className = classId;
            const subjectName = subjectId;
            const chapterName = chapterId;

            const baseBreadcrumbs = [
                { href: '/', label: 'Home' },
                { href: `/student/dashboard/${className}`, label: `Class ${className}` },
            ];

            try {
                if (pageType === 'class') {
                    const classSyllabus = syllabus[className as keyof typeof syllabus];
                    const subjectNames = classSyllabus ? Object.keys(classSyllabus) : [];
                    
                    setTitle(`Class ${className}`);
                    setDescription('Select a subject to explore.');
                    setCards(subjectNames.map(subject => ({
                        id: subject,
                        name: subject,
                        description: `${(classSyllabus as any)[subject]?.length || 0} chapters`,
                        path: `/student/dashboard/${className}/${encodeURIComponent(subject)}`
                    })));
                    setBreadcrumbItems(baseBreadcrumbs);
                }

                if (pageType === 'subject') {
                    const subjectChapters = syllabus[className as keyof typeof syllabus]?.[subjectName as keyof any] || [];

                    setTitle(subjectName);
                    setDescription('Select a chapter to start learning.');
                    setCards(subjectChapters.map(chapter => ({
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
                console.error("Error fetching data: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [pageType, pathSegments, authLoading, user]);

    const handleCardClick = (path: string) => {
        setIsNavigating(true);
        router.push(path);
    };
    
    const getGoogleDriveEmbedUrl = (url: string) => {
        const fileIdRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(fileIdRegex);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
        return url;
    };

    const handleResourceClick = (resource: Resource) => {
        if (resource.type === 'video') {
            if (resource.url.includes('youtube.com') || resource.url.includes('youtu.be')) {
                const videoIdMatch = resource.url.match(/(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
                if (videoIdMatch && videoIdMatch[1]) {
                    setSelectedVideoUrl(`https://www.youtube.com/embed/${videoIdMatch[1]}`);
                } else {
                     window.open(resource.url, '_blank');
                }
            } else {
                 window.open(resource.url, '_blank');
            }
        } else if (resource.type === 'infographic' || resource.type === 'mind-map') {
            const embedUrl = getGoogleDriveEmbedUrl(resource.url);
            setSelectedImageUrl(embedUrl);
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
                <DialogContent className="max-w-4xl w-full h-auto p-0 bg-card border-0">
                    <div className="aspect-video">
                        <iframe
                            src={selectedVideoUrl || ''}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
                <DialogContent className="max-w-5xl w-full p-0 bg-transparent border-0 shadow-none">
                     <DialogHeader className="p-4 absolute top-0 right-0 z-10">
                        {/* Title can be hidden or styled differently */}
                    </DialogHeader>
                    {selectedImageUrl && (
                        <div className="w-full h-full flex items-center justify-center">
                            <img 
                                src={selectedImageUrl} 
                                alt="Resource Preview" 
                                className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-md" 
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
