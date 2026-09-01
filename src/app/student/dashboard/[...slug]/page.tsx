
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
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

function ZoomableImageViewer({ src, alt, onClose }: { src: string, alt: string, onClose?: () => void }) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const lastDist = useRef<number | null>(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 6));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        setIsDragging(true);
        startPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        
        // Handle drag panning
        setOffset({
            x: e.clientX - startPos.current.x,
            y: e.clientY - startPos.current.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            setScale(prev => Math.min(Math.max(prev + delta, 0.5), 6));
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col touch-none">
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-xl">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white/90 hover:bg-white/20" onClick={handleZoomIn}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white/90 hover:bg-white/20" onClick={handleZoomOut}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white/90 hover:bg-white/20" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
                {onClose && (
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-xl border border-white/20" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div 
                ref={containerRef}
                className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
            >
                <img 
                    src={src} 
                    alt={alt}
                    draggable={false}
                    className="max-w-full max-h-full transition-transform duration-100 ease-out pointer-events-none"
                    style={{ 
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    }}
                />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-[10px] text-white/70 pointer-events-none border border-white/10 z-50">
                <span>Drag to move • Pinch or Ctrl+Scroll to zoom</span>
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

    // Activity Tracking Refs
    const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activeActivityIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(0);

    const stopActivityTracking = useCallback(() => {
        if (activityIntervalRef.current) {
            clearInterval(activityIntervalRef.current);
            activityIntervalRef.current = null;
        }
        
        if (activeActivityIdRef.current) {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            updateDoc(doc(db, 'user-activity', activeActivityIdRef.current), {
                durationSeconds: duration
            }).catch(() => {}); // Silent fail on unmount
            activeActivityIdRef.current = null;
        }
    }, []);

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

    useEffect(() => {
        if (!selectedResource) {
            stopActivityTracking();
        }
    }, [selectedResource, stopActivityTracking]);

    useEffect(() => {
        return () => stopActivityTracking();
    }, [stopActivityTracking]);

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

    const getGoogleDriveDirectImageUrl = (url: string) => {
        const fileIdMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s2000`;
        }
        return url;
    };

    const handleResourceClick = (resource: Resource) => {
        if (user && userDetails) {
            stopActivityTracking();
            startTimeRef.current = Date.now();
            
            addDoc(collection(db, 'user-activity'), {
                userId: user.uid,
                userName: userDetails.name,
                userEmail: userDetails.email,
                resourceId: resource.id,
                resourceTitle: resource.title,
                resourceClass: resource.class,
                resourceSubject: resource.subject,
                resourceChapter: resource.chapter,
                resourceType: resource.type,
                timestamp: serverTimestamp(),
                durationSeconds: 0
            }).then(docRef => {
                activeActivityIdRef.current = docRef.id;
                activityIntervalRef.current = setInterval(() => {
                    if (activeActivityIdRef.current) {
                        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                        updateDoc(doc(db, 'user-activity', activeActivityIdRef.current), {
                            durationSeconds: duration
                        }).catch(() => {});
                    }
                }, 10000);
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
        if (type === 'mind-map-json') return 'Mind Map';
        if (type === 'translated-chapter') return 'Translated Chapter';
        if (type === 'song') return 'Song';
        if (type === 'lesson-plan-text') return 'Lesson Plan';
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
                        {resources.map((resource, index) => (
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
                    <div className={cn("flex-1 w-full min-0 bg-muted/40", isFullImageMode && "bg-black")}>
                        {renderDialogContent()}
                    </div>
                </div>
            )}
        </>
    );
}
