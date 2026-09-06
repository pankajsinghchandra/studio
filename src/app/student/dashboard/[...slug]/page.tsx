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
    ZoomIn, ZoomOut, RotateCcw, Layout
} from 'lucide-react';
import { syllabus } from '@/lib/syllabus';
import { Button } from '@/components/ui/button';
import MindMap, { type MindMapNode as MindMapNodeType } from '@/components/mind-map';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

const getIcon = (itemType: 'class' | 'subject' | 'sub-subject' | 'chapter' | 'resource', name?: string, resourceType?: string, index: number = 0) => {
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

    if (itemType === 'subject' || itemType === 'sub-subject') {
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
    type: 'subject' | 'sub-subject' | 'chapter';
    resourceCount?: number;
}

function ZoomableImageViewer({ src, alt, onClose }: { src: string, alt: string, onClose?: () => void }) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    const pointers = useRef<Map<number, PointerEvent>>(new Map());
    const prevDiff = useRef<number>(-1);
    const lastTap = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 6));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (scale > 1) {
            handleReset();
        } else {
            setScale(2.5);
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        pointers.current.set(e.pointerId, e.nativeEvent);
        
        if (e.pointerType === 'touch') {
            const now = Date.now();
            if (now - lastTap.current < 300) {
                handleDoubleClick(e);
                lastTap.current = 0;
                return;
            }
            lastTap.current = now;
        }

        if (pointers.current.size === 1) {
            setIsDragging(true);
            startPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        }
        
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        pointers.current.set(e.pointerId, e.nativeEvent);
        const pointerList = Array.from(pointers.current.values());

        if (pointerList.length === 2) {
            setIsDragging(false);
            const curDiff = Math.hypot(
                pointerList[0].clientX - pointerList[1].clientX,
                pointerList[0].clientY - pointerList[1].clientY
            );

            if (prevDiff.current > 0) {
                const delta = (curDiff - prevDiff.current) * 0.01;
                setScale(prev => Math.min(Math.max(prev + delta, 0.5), 6));
            }
            prevDiff.current = curDiff;
        } 
        else if (isDragging && pointerList.length === 1) {
            setOffset({
                x: e.clientX - startPos.current.x,
                y: e.clientY - startPos.current.y
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) {
            prevDiff.current = -1;
        }
        if (pointers.current.size === 0) {
            setIsDragging(false);
        }
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.2 : 0.2;
                setScale(prev => Math.min(Math.max(prev + delta, 0.5), 6));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-black overflow-hidden flex flex-col touch-none"
        >
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
                className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDoubleClick}
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-[10px] text-white/70 pointer-events-none border border-white/10 z-50 text-center">
                <span>Pinch or Ctrl+Scroll to zoom • Double tap to reset • Drag to move</span>
            </div>
        </div>
    );
}

export default function DynamicPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, userDetails, loading: authLoading } = useAuth();
    
    const pathSegments = useMemo(() => pathname.split('/').filter(Boolean).slice(2), [pathname]);
    
    const classId = pathSegments[0];
    const subjectName = pathSegments[1] ? decodeURIComponent(pathSegments[1]) : undefined;
    const subOrChapterName = pathSegments[2] ? decodeURIComponent(pathSegments[2]) : undefined;
    const finalChapterName = pathSegments[3] ? decodeURIComponent(pathSegments[3]) : undefined;

    const classData = classId ? syllabus[classId] : undefined;
    const subjectData = (classData && subjectName) ? classData[subjectName] : undefined;
    const isSubjectNested = subjectData && !Array.isArray(subjectData);

    const pageType = useMemo(() => {
        if (pathSegments.length === 1) return 'class';
        if (pathSegments.length === 2) {
            return isSubjectNested ? 'subject-nested' : 'subject';
        }
        if (pathSegments.length === 3) {
            return isSubjectNested ? 'sub-subject' : 'chapter';
        }
        if (pathSegments.length === 4) return 'chapter';
        return 'unknown';
    }, [pathSegments, isSubjectNested]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cards, setCards] = useState<CardData[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

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
            }).catch(() => {});
            activeActivityIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (pageType === 'unknown' || authLoading || !user) return;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                if (pageType === 'class') {
                    const subjectNames = classData ? Object.keys(classData) : [];
                    setTitle(`Class ${classId}`);
                    setDescription('Select a subject to explore.');
                    setCards(subjectNames.map(s => ({
                        id: s,
                        name: s,
                        description: Array.isArray(classData?.[s]) ? `${(classData?.[s] as string[]).length} chapters` : `${Object.keys(classData?.[s] as object).length} categories`,
                        path: `/student/dashboard/${classId}/${encodeURIComponent(s)}`,
                        type: 'subject'
                    })));
                } else if (pageType === 'subject-nested') {
                    const subSubjects = Object.keys(subjectData as object);
                    setTitle(subjectName!);
                    setDescription('Select a category to explore.');
                    setCards(subSubjects.map(sub => ({
                        id: sub,
                        name: sub,
                        description: `${(subjectData as any)[sub].length} chapters`,
                        path: `/student/dashboard/${classId}/${encodeURIComponent(subjectName!)}/${encodeURIComponent(sub)}`,
                        type: 'sub-subject'
                    })));
                } else if (pageType === 'subject' || pageType === 'sub-subject') {
                    const chapters = (pageType === 'subject' 
                        ? (subjectData as string[]) || []
                        : (subjectData as any)[subOrChapterName!] || []) as string[];
                    
                    const contextName = pageType === 'subject' ? subjectName! : subOrChapterName!;
                    setTitle(contextName);
                    setDescription('Select a chapter to start learning.');

                    // Fetch resource counts for these chapters
                    const isComputerCrossClass = subjectName?.toLowerCase().includes('computer') && ['6', '7', '8'].includes(classId);
                    
                    let q = query(collection(db, "resources"), 
                        where("subject", "==", subjectName)
                    );
                    
                    if (isComputerCrossClass) {
                        q = query(q, where("class", "in", ["6", "7", "8"]));
                    } else {
                        q = query(q, where("class", "==", classId));
                    }

                    const querySnapshot = await getDocs(q);
                    const chapterCounts: Record<string, number> = {};
                    querySnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const ch = data.chapter;
                        chapterCounts[ch] = (chapterCounts[ch] || 0) + 1;
                    });

                    setCards(chapters.map((ch: string) => ({
                        id: ch,
                        name: ch,
                        description: 'View resources',
                        path: pageType === 'subject' 
                            ? `/student/dashboard/${classId}/${encodeURIComponent(subjectName!)}/${encodeURIComponent(ch)}`
                            : `/student/dashboard/${classId}/${encodeURIComponent(subjectName!)}/${encodeURIComponent(subOrChapterName!)}/${encodeURIComponent(ch)}`,
                        type: 'chapter',
                        resourceCount: chapterCounts[ch] || 0
                    })));
                } else if (pageType === 'chapter') {
                    const targetChapter = finalChapterName || subOrChapterName;
                    
                    const isComputerCrossClass = subjectName?.toLowerCase().includes('computer') && ['6', '7', '8'].includes(classId);
                    
                    let q;
                    if (isComputerCrossClass) {
                        q = query(collection(db, "resources"),
                            where("subject", "==", subjectName),
                            where("chapter", "==", targetChapter),
                            where("class", "in", ["6", "7", "8"])
                        );
                    } else {
                        q = query(collection(db, "resources"),
                            where("class", "==", classId),
                            where("subject", "==", subjectName),
                            where("chapter", "==", targetChapter)
                        );
                    }

                    const querySnapshot = await getDocs(q);
                    const fetchedResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[];
                    setTitle(targetChapter!);
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
    }, [pageType, classId, subjectName, subOrChapterName, finalChapterName, classData, subjectData, authLoading, user]);

    useEffect(() => {
        if (!selectedResource) stopActivityTracking();
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
        return videoIdMatch ? `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}` : null;
    }

    const getGoogleDriveEmbedUrl = (url: string) => {
        const fileIdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        return fileIdMatch ? `https://drive.google.com/file/d/${fileIdMatch[1]}/preview` : url;
    };

    const getGoogleDriveDirectImageUrl = (url: string) => {
        const fileIdMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
        return fileIdMatch ? `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s2000` : url;
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
                        updateDoc(doc(db, 'user-activity', activeActivityIdRef.current), { durationSeconds: duration }).catch(() => {});
                    }
                }, 10000);
            }).catch(e => console.error("Error logging activity: ", e));
        }
        setSelectedResource(resource);
    };
    
    if (authLoading || isLoading) return <LoadingOverlay isLoading={true} />;

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
                try { mindMapData = JSON.parse(url); } catch (e) { return <div className="p-6 text-destructive-foreground bg-destructive">Invalid Mind Map JSON format.</div> }
            }
        }

        if (isDirectEmbeddable) {
            if (type === 'mind-map-json' && mindMapData) return <MindMap data={mindMapData} />;
            if (type === 'lesson-plan-text') {
                return (
                    <div className="w-full h-full bg-background rounded-b-lg relative">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <span className="text-7xl font-bold text-muted-foreground/10 rotate-[-30deg]">Vidyalaya Notes</span>
                        </div>
                         <div className="relative z-10 w-full h-full overflow-y-auto p-6">
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: url }} />
                        </div>
                    </div>
                );
            }
            if (isDirectImage) return <ZoomableImageViewer src={embedUrl || url} alt={title} onClose={() => setSelectedResource(null)} />;
            if (isGoogleDriveEmbed) {
                return (
                    <div className="w-full h-full overflow-hidden">
                        <iframe src={embedUrl || url} title={title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-[calc(100%+48px)] -mt-12 rounded-b-lg" />
                    </div>
                );
            }
            return <iframe src={embedUrl || url} title={title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full rounded-b-lg" />;
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/40">
                <p className="text-lg font-semibold text-foreground mb-2">This content cannot be shown here.</p>
                <p className="text-muted-foreground mb-4">Please use the button below to open it in a new tab.</p>
                <Button asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open Content</a></Button>
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
                                    className="group bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 h-full cursor-pointer active:scale-95 flex flex-col justify-between"
                                    onClick={() => handleCardClick(card.path)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <div className='flex items-center gap-4'>
                                          {getIcon(card.type === 'sub-subject' ? 'sub-subject' : (card.type === 'chapter' ? 'chapter' : 'subject'), card.name, undefined, index)}
                                          <div>
                                            <CardTitle className="font-headline text-xl text-foreground group-hover:text-primary transition-colors">{card.name}</CardTitle>
                                            <CardDescription>{card.description}</CardDescription>
                                          </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </CardHeader>
                                    
                                    {card.type === 'chapter' && (
                                        <div className="px-4 pb-4 mt-auto">
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white border-none shadow-md px-3 py-1 rounded-md text-[10px] font-bold tracking-wide flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <Layout className="w-3 h-3" />
                                                    {card.resourceCount || 0} Content Available
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))
                    ) : <p className="col-span-full text-center text-muted-foreground font-medium">No items found in this section.</p>
                )}
                {pageType === 'chapter' && (
                    <>
                        {resources.map((resource, index) => (
                            <Card key={resource.id} className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 h-full cursor-pointer active:scale-95" onClick={() => handleResourceClick(resource)}>
                                <CardHeader className="p-4">
                                    <div className="flex items-start gap-4">
                                        {getIcon('resource', undefined, resource.type, index)}
                                        <div>
                                            <CardTitle className="font-headline text-xl text-foreground leading-tight group-hover:text-primary transition-colors">{resource.title}</CardTitle>
                                            <CardDescription className="mt-1 capitalize flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-primary/40" />
                                                {getResourceTypeLabel(resource.type)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                         {resources.length === 0 && <p className="col-span-full text-center text-muted-foreground font-medium py-12 bg-muted/20 rounded-2xl border-2 border-dashed">No resources found for this chapter yet.</p>}
                    </>
                )}
                </div>
            </div>
             {selectedResource && (
                 <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in-0">
                    {!isFullImageMode && (
                        <header className="p-2 bg-card/80 backdrop-blur-sm flex-row justify-between items-center z-10 shrink-0 border-b flex">
                            <h2 className="text-foreground text-lg truncate px-4 font-bold text-primary">{selectedResource.title}</h2>
                            <div className="flex items-center gap-2">
                                {selectedResource.url && !['lesson-plan-text', 'mind-map-json'].includes(selectedResource.type) && (
                                    <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary transition-colors" asChild>
                                        <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-5 h-5" />
                                            <span className="sr-only">Open in new tab</span>
                                        </a>
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-destructive transition-colors" onClick={() => setSelectedResource(null)}>
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
