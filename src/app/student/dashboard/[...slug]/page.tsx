'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/app/providers';
import type { Resource } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingOverlay from '@/components/loading-overlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { 
    FileText, Video, ImageIcon, BookOpen, ChevronRight, ExternalLink,
    School, Book, FlaskConical, Languages, Landmark, Calculator, Palette, Dna, Atom, 
    Globe, Scroll, Milestone, Users, Drama, Leaf, Folder, X, Share2
} from 'lucide-react';
import { syllabus } from '@/lib/syllabus';
import { Button } from '@/components/ui/button';
import MindMap, { type MindMapNode as MindMapNodeType } from '@/components/mind-map';

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
        case 'mind-map-json':
            return <Share2 {...resourceIconProps} />;
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
            return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}`;
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
        let embedUrl: string | null = null;
        let isDirectEmbeddable = false;
        let isGoogleDriveEmbed = false;
        let mindMapData: MindMapNodeType | null = null;

        if (type === 'video') {
            embedUrl = getYoutubeEmbedUrl(url);
            isDirectEmbeddable = !!embedUrl;
        } else if (['infographic', 'mind-map', 'lesson-plan-image', 'pdf-note', 'lesson-plan-pdf'].includes(type) && url.includes('drive.google.com')) {
            embedUrl = getGoogleDriveEmbedUrl(url);
            isDirectEmbeddable = true;
            isGoogleDriveEmbed = true;
        } else if (type === 'lesson-plan-text' || type === 'mind-map-json') {
            isDirectEmbeddable = true;
            if (type === 'mind-map-json') {
                try {
                    mindMapData = JSON.parse(url);
                } catch (e) {
                    return <div className="p-6 text-destructive-foreground bg-destructive">Invalid Mind Map JSON format.</div>
                }
            }
        } else if (['infographic', 'mind-map', 'lesson-plan-image'].includes(type)) {
            embedUrl = url;
            isDirectEmbeddable = true;
        }

        if (isDirectEmbeddable) {
             if (type === 'mind-map-json' && mindMapData) {
                return <MindMap data={mindMapData} />
            }
            if (type === 'lesson-plan-text') {
                 return (
                    <div className="w-full h-full prose prose-sm max-w-none p-6 text-foreground bg-background rounded-lg overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: url.replace(/\n/g, '<br />') }} />
                    </div>
                )
            }
             if (['infographic', 'mind-map', 'lesson-plan-image'].includes(type) && !url.includes('drive.google.com')) {
                return (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                        <img 
                            src={url} 
                            alt={title}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                )
            }
            if (isGoogleDriveEmbed) {
                return (
                    <div className="w-full h-full overflow-hidden">
                        <iframe
                            src={embedUrl || url}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-[calc(100%+48px)] -mt-12 rounded-b-lg"
                        ></iframe>
                    </div>
                )
            }

            return (
                 <iframe
                    src={embedUrl || url}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-b-lg"
                ></iframe>
            )
        }
        
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/40">
                <p className="text-lg font-semibold text-foreground mb-2">This content cannot be shown here.</p>
                <p className="text-muted-foreground mb-4">Please use the button below to open it in a new tab.</p>
                <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Content
                    </a>
                </Button>
            </div>
        );
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
                  className="max-w-none w-screen h-screen p-0 bg-background/95 backdrop-blur-sm border-0 shadow-none data-[state=open]:sm:zoom-in-90 flex flex-col"
                >
                    <DialogHeader className="p-2 bg-card rounded-t-lg flex-row justify-between items-center z-10 shrink-0 border-b">
                        <DialogTitle className="text-foreground text-lg truncate px-2">{selectedResource?.title}</DialogTitle>
                         <div className="flex items-center gap-2">
                            {selectedResource?.url && !['lesson-plan-text', 'mind-map-json'].includes(selectedResource.type) && (
                                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" asChild>
                                    <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-5 h-5" />
                                        <span className="sr-only">Open in new tab</span>
                                    </a>
                                </Button>
                             )}
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                                    <X className="w-5 h-5" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </DialogClose>
                         </div>
                    </DialogHeader>
                    <div className="flex-1 w-full h-full bg-muted/40">
                      {selectedResource && renderDialogContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
