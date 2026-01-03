'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/app/providers';
import type { Resource } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingOverlay from '@/components/loading-overlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    FileText, Video, ImageIcon, BookOpen, ChevronRight, 
    School, Book, FlaskConical, Languages, Landmark, Calculator, Palette, Dna, Atom, 
    Globe, Scroll, Milestone, Users, Drama, Leaf, Folder, X
} from 'lucide-react';
import { syllabus } from '@/lib/syllabus';

const subjectIcons: { [key: string]: React.ElementType } = {
    'mathematics': Calculator,
    'maths': Calculator,
    'गणित': Calculator,
    'environmental studies': Leaf,
    'पर्यावरण': Leaf,
    'hindi': Scroll,
    'english': Book,
    'science': FlaskConical,
    'विज्ञान': FlaskConical,
    'social science': Users,
    'history': Landmark,
    'geography': Globe,
    'civics': Users,
    'computer': Palette,
    'sanskrit': Drama,
    'biology': Dna,
    'physics': Atom,
    'chemistry': FlaskConical,
    'default': Folder
};

const chapterIcons = [Milestone, Scroll, Book, Users, Drama, Leaf, Landmark, Globe, Calculator, FlaskConical, Palette, Dna, Atom];

const getIcon = (itemType: 'class' | 'subject' | 'chapter' | 'resource', name?: string, resourceType?: string, subjectNameForChapter?: string, index: number = 0) => {
    const iconColors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500', 'text-pink-500', 'text-indigo-500', 'text-teal-500'];
    const randomColor = iconColors[index % iconColors.length];

    const iconProps = { className: `w-8 h-8 ${randomColor} drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]` };
    const resourceIconProps = { className: "w-8 h-8 text-primary/80 mt-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]" };

    if (itemType === 'class') return <School {...iconProps} />;
    
    const getSubjectIcon = (subjectName: string) => {
        const nameLower = subjectName.toLowerCase();
        for (const key in subjectIcons) {
            if (nameLower.includes(key)) {
                const IconComponent = subjectIcons[key];
                return <IconComponent {...iconProps} />;
            }
        }
        return <Folder {...iconProps} />;
    }

    if (itemType === 'subject') {
       return getSubjectIcon(name || '');
    }

    if (itemType === 'chapter') {
        const IconComponent = chapterIcons[index % chapterIcons.length];
        return <IconComponent {...iconProps} />;
    };

    // Resource icons
    switch (resourceType) {
        case 'lesson-plan-pdf':
        case 'pdf-note':
        case 'lesson-plan-text':
            return <FileText {...resourceIconProps} />;
        case 'video':
            return <Video {...resourceIconProps} />;
        case 'infographic':
        case 'mind-map':
        case 'lesson-plan-image':
            return <ImageIcon {...resourceIconProps} />;
        default:
            return <BookOpen {...resourceIconProps} />;
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

    const subjectNameForChapterIcon = useMemo(() => {
        if (pageType === 'chapter' && pathSegments.length > 1) {
            return pathSegments[1];
        }
        return '';
    }, [pageType, pathSegments]);


    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cards, setCards] = useState<CardData[]>([]);

    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    useEffect(() => {
        if (pageType === 'unknown' || authLoading || !user) return;
        setIsLoading(true);

        const [classId, subjectId, chapterId] = pathSegments.map(decodeURIComponent);

        const fetchData = async () => {
            const className = classId;
            const subjectName = subjectId;
            const chapterName = chapterId;

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
                }

                if (pageType === 'subject') {
                    const subjectChapters = syllabus[className as keyof typeof syllabus]?.[subjectName as keyof any] || [];

                    setTitle(subjectName);
                    setDescription('Select a chapter to start learning.');
                    setCards(subjectChapters.map((chapter: string) => ({
                        id: chapter,
                        name: chapter,
                        description: 'View resources',
                        path: `/student/dashboard/${className}/${encodeURIComponent(subjectName)}/${encodeURIComponent(chapter)}`
                    })));
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
    
    const getYoutubeEmbedUrl = (url: string) => {
        const videoIdMatch = url.match(/(?:v=|vi\/|embed\/|youtu.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch && videoIdMatch[1]) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }
        return null;
    }

    const getGoogleDriveEmbedUrl = (url: string) => {
        const fileIdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
        return url;
    };


    const handleResourceClick = (resource: Resource) => {
        setSelectedResource(resource);
    };
    
    if (authLoading || isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    const renderDialogContent = () => {
        if (!selectedResource) return null;

        const { type, url, title } = selectedResource;
        
        if (type === 'video') {
            const embedUrl = getYoutubeEmbedUrl(url);
            if (embedUrl) {
                return (
                     <div className="aspect-video w-full h-full">
                        <DialogTitle className="sr-only">{title}</DialogTitle>
                        <iframe
                            src={embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                )
            }
        }
        
        const isGoogleDriveResource = url.includes('drive.google.com');

        if (isGoogleDriveResource && (type === 'infographic' || type === 'mind-map' || type === 'lesson-plan-image' || type === 'pdf-note' || type === 'lesson-plan-pdf')) {
            const embedUrl = getGoogleDriveEmbedUrl(url);
            return (
                <div className="w-full h-full">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <iframe
                        src={embedUrl}
                        className="w-full h-full rounded-lg border-0"
                        frameBorder="0"
                    ></iframe>
                </div>
            );
        }

        if (type === 'lesson-plan-text') {
            return (
                <div className="w-full h-full prose prose-sm max-w-none p-6 text-foreground bg-background rounded-lg overflow-y-auto">
                    <DialogTitle className="text-2xl font-bold mb-4">{title}</DialogTitle>
                    <div dangerouslySetInnerHTML={{ __html: url.replace(/\n/g, '<br />') }} />
                </div>
            )
        }
        
        if (type === 'infographic' || type === 'mind-map' || type === 'lesson-plan-image') {
             return (
                <div className="w-full h-full flex items-center justify-center">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <img 
                        src={url} 
                        alt={title}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )
        }

        // Fallback for opening any other resource type in a new tab
        window.open(url, '_blank');
        setSelectedResource(null);
        return null;
    }

    return (
        <>
            <LoadingOverlay isLoading={isNavigating} />
            <div className="container mx-auto px-4 py-8">
                <header className="mb-8">
                    <h1 className="font-headline text-4xl font-bold text-foreground">{title}</h1>
                    <p className="text-lg text-muted-foreground">{description}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageType !== 'chapter' && (
                     cards.length > 0 ? (
                            cards.map((card, index) => (
                                <Card 
                                    key={card.id} 
                                    className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group"
                                    onClick={() => handleCardClick(card.path)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <div className='flex items-center gap-4'>
                                          {getIcon(pageType === 'class' ? 'subject' : 'chapter', card.name, undefined, subjectNameForChapterIcon, index)}
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
                         .filter(resource => !(userDetails?.role === 'student' && (resource.type === 'lesson-plan-pdf' || resource.type === 'lesson-plan-image' || resource.type === 'lesson-plan-text')))
                         .map((resource, index) => (
                            <Card key={resource.id} className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full cursor-pointer active:scale-95 group" onClick={() => handleResourceClick(resource)}>
                                <CardHeader className="p-4">
                                    <div className="flex items-start gap-4">
                                        {getIcon('resource', undefined, resource.type, undefined, index)}
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
            
            <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
                <DialogContent 
                  className="max-w-none w-screen h-screen p-2 bg-background/95 backdrop-blur-sm border-0 shadow-none data-[state=open]:sm:zoom-in-90 flex flex-col"
                  onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="p-2 bg-transparent rounded-t-lg flex-row justify-between items-center z-10">
                        <DialogTitle className="text-foreground text-lg truncate px-2">{selectedResource?.title}</DialogTitle>
                         <DialogDescription>
                            <button onClick={() => setSelectedResource(null)} className="p-1 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors">
                                <X className="w-6 h-6" />
                                <span className="sr-only">Close</span>
                            </button>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 w-full h-full -mt-12">
                      {selectedResource && renderDialogContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
