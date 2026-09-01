
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '@/app/providers';
import type { Resource } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingOverlay from '@/components/loading-overlay';
import { 
    FileText, Video, ImageIcon, BookOpen, ChevronRight, ExternalLink,
    School, Book, FlaskConical, Languages, Landmark, Calculator, Palette, Dna, Atom, 
    Globe, Scroll, Milestone, Users, Drama, Leaf, Folder, X, Share2, Pencil, Music,
    ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { syllabus } from '@/lib/syllabus';
import { Button } from '@/components/ui/button';
import MindMap, { type MindMapNode as MindMapNodeType } from '@/components/mind-map';
import { cn } from '@/lib/utils';

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
    const iconProps = { className: `w-8 h-8 text-primary drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]` };
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
            return <FileText {...resourceIconProps} />;
        case 'lesson-plan-text':
             return <Pencil {...resourceIconProps} />;
        case 'video':
            return <Video {...resourceIconProps} />;
        case 'infographic':
        case 'mind-map':
        case 'lesson-plan-image':
            return <ImageIcon {...resourceIconProps} />;
        case 'mind-map-json':
            return <Share2 {...resourceIconProps} />;
        case 'translated-chapter':
            return <Languages {...resourceIconProps} />;
        case 'song':
            return <Music {...resourceIconProps} />;
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

/**
 * Custom Viewer for Images with Zoom Support (Mobile Pinch & PC Ctrl+Scroll)
 */
function ZoomableImageViewer({ src, alt, onClose }: { src: string, alt: string, onClose?: () => void }) {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const pointers = useRef<Map<number, PointerEvent>>(new Map());
    const lastDist = useRef<number | null>(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleReset = () => setScale(1);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) handleZoomIn();
                else handleZoomOut();
            }
        };

        const handlePointerDown = (e: PointerEvent) => {
            pointers.current.set(e.pointerId, e);
        };

        const handlePointerMove = (e: PointerEvent) => {
            pointers.current.set(e.pointerId, e);
            
            if (pointers.current.size === 2) {
                const pts = Array.from(pointers.current.values());
                const dx = pts[0].clientX - pts[1].clientX;
                const dy = pts[0].clientY - pts[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (lastDist.current !== null) {
                    const delta = dist - lastDist.current;
                    if (Math.abs(delta) > 2) {
                        setScale(prev => {
                            const next = prev + (delta > 0 ? 0.05 : -0.05);
                            return Math.min(Math.max(next, 0.5), 5);
                        });
                    }
                }
                lastDist.current = dist;
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) {
                lastDist.current = null;
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('pointerdown', handlePointerDown);
        el.addEventListener('pointermove', handlePointerMove);
        el.addEventListener('pointerup', handlePointerUp);
        el.addEventListener('pointercancel', handlePointerUp);

        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('pointerdown', handlePointerDown);
            el.removeEventListener('pointermove', handlePointerMove);
            el.removeEventListener('pointerup', handlePointerUp);
            el.removeEventListener('pointercancel', handlePointerUp);
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col touch-none">
            {/* Zoom Controls & Close Button */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <div className="flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-xl">
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-white hover:bg-white/20" onClick={handleZoomIn}>
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-white hover:bg-white/20" onClick={handleZoomOut}>
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-white hover:bg-white/20" onClick={handleReset}>
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                </div>
                {onClose && (
                    <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full shadow-lg border border-white/10" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Image Container */}
            <div 
                ref={containerRef}
                className="flex-1 w-full overflow-auto flex items-center justify-center p-4 cursor-move"
            >
                <img 
                    src={src} 
                    alt={alt}
                    draggable={false}
                    className="max-w-none transition-transform duration-100 ease-out origin-center"
                    style={{ 
                        transform: `scale(${scale})`,
                        height: scale === 1 ? '90%' : 'auto',
                        maxWidth: scale === 1 ? '95%' : 'none',
                        objectFit: 'contain'
                    }}
                />
            </div>
            
            {/* Hint Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs text-white/80 pointer-events-none border border-white/10">
                <span className="md:hidden">Pinch to zoom • Drag to pan</span>
                <span className="hidden md:inline">Ctrl + Scroll to zoom • Drag to pan</span>
            </div>
        </div>
    );
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
                    const classSyllabus = syllabus[className];
                    const subjectNames = classSyllabus ? Object.keys(classSyllabus) : [];
                    
                    setTitle(`Class ${className}`);
                    setDescription('Select a subject to explore.');
                    setCards(subjectNames.map(subject => ({
                        id: subject,
                        name: subject,
                        description: `${classSyllabus?.[subject]?.length || 0} chapters`,
                        path: `/student/dashboard/${className}/${encodeURIComponent(subject)}`
                    })));
                }

                if (pageType === 'subject') {
                    const subjectChapters = syllabus[className]?.[subjectName] || [];

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
        const videoIdMatch = url.match(/(?:v=|vi\/|embed\/|youtu.be\/|watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);
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

    /**
     * Converts Google Drive link to a direct high-res image URL (lh3 format)
     */
    const getGoogleDriveDirectImageUrl = (url: string) => {
        const fileIdMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            // Using s2000 for high resolution suitable for zooming
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s2000`;
        }
        return url;
    };


    const handleResourceClick = (resource: Resource) => {
        if (user && userDetails) {
            addDoc(collection(db, 'user-activity'), {
                userId: user.uid,
                userName: userDetails.name,
                userEmail: userDetails.email,
                resourceId: resource.id,
                resourceTitle: resource.title,
                resourceClass: resource.class,
                resourceSubject: resource.subject,
                resourceChapter: resource.chapter,
                timestamp: new Date(),
            }).catch(error => {
                console.error("Error logging activity: ", error);
            });
        }
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
        let isDirectImage = false;
        let mindMapData: MindMapNodeType | null = null;

        const imageTypes = ['infographic', 'mind-map', 'lesson-plan-image'];

        if (imageTypes.includes(type)) {
            // For images, if it's from Drive, ALWAYS convert to lh3 direct link
            embedUrl = url.includes('drive.google.com') ? getGoogleDriveDirectImageUrl(url) : url;
            isDirectImage = true;
            isDirectEmbeddable = true;
        } else if (type === 'video' || type === 'song') {
            embedUrl = getYoutubeEmbedUrl(url);
            isDirectEmbeddable = !!embedUrl;
        } else if (['pdf-note', 'lesson-plan-pdf', 'translated-chapter'].includes(type) && url.includes('drive.google.com')) {
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
        }

        if (isDirectEmbeddable) {
             if (type === 'mind-map-json' && mindMapData) {
                return <MindMap data={mindMapData} />
            }
            if (type === 'lesson-plan-text') {
                 return (
                    <div className="w-full h-full bg-background rounded-b-lg relative">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <span className="text-7xl font-bold text-muted-foreground/10 rotate-[-30deg]">Vidyalaya Notes</span>
                        </div>
                         <div className="relative z-10 w-full h-full overflow-y-auto p-6">
                            <div
                                className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: url }}
                            />
                        </div>
                    </div>
                )
            }
            
            // Zoomable Image Viewer for Infographics/Mind Maps
            if (isDirectImage) {
                return <ZoomableImageViewer src={embedUrl || url} alt={title} onClose={() => setSelectedResource(null)} />;
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
    
    const getResourceTypeLabel = (type: string) => {
        if (type === 'mind-map-json') {
            return 'Mind Map';
        }
        if (type === 'translated-chapter') {
            return 'Translated Chapter';
        }
        if (type === 'song') {
            return 'Song';
        }
         if (type === 'lesson-plan-text') {
            return 'Lesson Plan';
        }
        return type.replace(/-/g, ' ');
    };

    const isFullImageMode = selectedResource && ['infographic', 'mind-map', 'lesson-plan-image'].includes(selectedResource.type);

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
                                    className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 h-full cursor-pointer active:scale-95"
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
                         .map((resource, index) => (
                            <Card key={resource.id} className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 h-full cursor-pointer active:scale-95" onClick={() => handleResourceClick(resource)}>
                                <CardHeader className="p-4">
                                    <div className="flex items-start gap-4">
                                        {getIcon('resource', undefined, resource.type, undefined, index)}
                                        <div>
                                            <CardTitle className="font-headline text-xl text-foreground leading-tight">{resource.title}</CardTitle>
                                            <CardDescription className="mt-1 capitalize">{getResourceTypeLabel(resource.type)}</CardDescription>
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
            
             {selectedResource && (
                 <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in-0">
                    {!isFullImageMode && (
                        <header className="p-2 bg-card/80 backdrop-blur-sm flex-row justify-between items-center z-10 shrink-0 border-b flex">
                            <h2 className="text-foreground text-lg truncate px-2 font-semibold">{selectedResource.title}</h2>
                            <div className="flex items-center gap-2">
                                {selectedResource.url && !['lesson-plan-text', 'mind-map-json'].includes(selectedResource.type) && (
                                    <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" asChild>
                                        <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-5 h-5" />
                                            <span className="sr-only">Open in new tab</span>
                                        </a>
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" onClick={() => setSelectedResource(null)}>
                                    <X className="w-5 h-5" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </div>
                        </header>
                    )}
                    <div className={cn("flex-1 w-full min-h-0 bg-muted/40", isFullImageMode && "bg-black")}>
                        {renderDialogContent()}
                    </div>
                </div>
            )}
        </>
    );
}

