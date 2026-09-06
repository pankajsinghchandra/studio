
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Resource } from '@/lib/types';
import { syllabus } from '@/lib/syllabus';
import LoadingOverlay from '@/components/loading-overlay';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertCircle, Save, CheckCircle2, RefreshCcw, Loader, BookOpen, Bookmark, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FixContentPage() {
    const { user, userDetails, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isAutoFixing, setIsAutoFixing] = useState(false);
    
    const [pendingChanges, setPendingChanges] = useState<Record<string, { subject: string, chapter: string }>>({});

    useEffect(() => {
        if (!loading && (!user || userDetails?.email !== 'quizpankaj@gmail.com')) {
            router.replace('/');
        } else if (!loading) {
            fetchResources();
        }
    }, [user, userDetails, loading, router]);

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'resources'));
            const snap = await getDocs(q);
            const allRes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource));
            setResources(allRes);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Fetch Error", description: "Could not load resources." });
        } finally {
            setIsLoading(false);
        }
    };

    const normalizeName = (text: string) => {
        if (!text) return "";
        // Remove numbers, "Chapter", "अध्याय", "Prose", "Poetry", "*", and common junk
        return text.replace(/^[0-9\.\-\s\*]+/, '')
                  .replace(/^(अध्याय|Chapter|Prose|Poetry)\s*\d+[:\s]*/i, '')
                  .trim()
                  .toLowerCase();
    };

    const orphanedResources = useMemo(() => {
        return resources.filter(res => {
            const classKey = String(res.class);
            const classData = syllabus[classKey];
            if (!classData) return true;
            
            const subjectData = classData[res.subject];
            if (!subjectData) return true;

            const targetChapter = normalizeName(res.chapter);
            
            if (Array.isArray(subjectData)) {
                return !subjectData.some(c => normalizeName(c) === targetChapter);
            } else {
                let found = false;
                Object.values(subjectData).forEach((chapters: any) => {
                    if (Array.isArray(chapters) && chapters.some(c => normalizeName(c) === targetChapter)) {
                        found = true;
                    }
                });
                return !found;
            }
        });
    }, [resources]);

    const handleMagicRepair = async () => {
        if (orphanedResources.length === 0) return;
        
        setIsAutoFixing(true);
        let fixedCount = 0;
        const batch = writeBatch(db);

        try {
            for (const res of orphanedResources) {
                const classKey = String(res.class);
                const classData = syllabus[classKey];
                if (!classData) continue;

                const targetChapterNorm = normalizeName(res.chapter);
                let foundSubject = "";
                let foundChapter = "";

                // SEARCH ALL SUBJECTS IN THE CLASS
                for (const [subName, subData] of Object.entries(classData)) {
                    if (Array.isArray(subData)) {
                        const match = subData.find(c => normalizeName(c) === targetChapterNorm);
                        if (match) {
                            foundSubject = subName;
                            foundChapter = match;
                            break;
                        }
                    } else {
                        // Handle sub-categories (like Science sub-topics)
                        for (const chapters of Object.values(subData)) {
                            const match = (chapters as string[]).find(c => normalizeName(c) === targetChapterNorm);
                            if (match) {
                                foundSubject = subName;
                                foundChapter = match;
                                break;
                            }
                        }
                        if (foundSubject) break;
                    }
                }

                if (foundSubject && foundChapter) {
                    const docRef = doc(db, 'resources', res.id);
                    batch.update(docRef, {
                        subject: foundSubject,
                        chapter: foundChapter
                    });
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                await batch.commit();
                toast({ title: "Repair Success!", description: `Automatically matched and fixed ${fixedCount} resources.` });
                fetchResources(); // Refresh the list
            } else {
                toast({ variant: 'default', title: "No Matches Found", description: "Could not find exact chapter matches. Please map manually." });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Repair Error", description: "Something went wrong during auto-repair." });
        } finally {
            setIsAutoFixing(false);
        }
    };

    const handleQuickUpdate = async (resId: string) => {
        const change = pendingChanges[resId];
        if (!change || !change.subject || !change.chapter) {
            toast({ variant: 'destructive', title: "Error", description: "Please select both subject and chapter." });
            return;
        }

        setUpdatingId(resId);
        try {
            await updateDoc(doc(db, 'resources', resId), {
                subject: change.subject,
                chapter: change.chapter
            });
            
            toast({ title: "Success", description: "Resource updated successfully!" });
            
            setResources(prev => prev.filter(r => r.id !== resId));
            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated[resId];
                return updated;
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to update." });
        } finally {
            setUpdatingId(null);
        }
    };

    const getChaptersForSubject = (classId: string, subject: string) => {
        const classData = syllabus[classId];
        if (!classData || !subject) return [];
        const subData = classData[subject];
        if (Array.isArray(subData)) return subData;
        
        let flatChapters: string[] = [];
        Object.values(subData).forEach((list: any) => {
            if (Array.isArray(list)) flatChapters = [...flatChapters, ...list];
        });
        return [...new Set(flatChapters)].sort();
    };

    if (loading || isLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-foreground flex items-center gap-3">
                        Content Repair Hub
                        <Badge variant="destructive" className="animate-pulse">{orphanedResources.length}</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Showing items that are not mapped to the current syllabus.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {orphanedResources.length > 0 && (
                        <Button 
                            variant="default" 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg text-white font-bold"
                            onClick={handleMagicRepair}
                            disabled={isAutoFixing}
                        >
                            {isAutoFixing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Magic Auto-Repair All
                        </Button>
                    )}
                    <Button variant="outline" onClick={fetchResources}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
                    </Button>
                </div>
            </header>

            <div className="grid gap-6">
                {orphanedResources.length > 0 && (
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                Instructions
                            </CardTitle>
                            <CardDescription>
                                Current details are in <span className="text-destructive font-bold">Red</span>. Use <strong>Magic Auto-Repair</strong> for one-click fix, or choose manually.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                <Card className="overflow-hidden border-border/60">
                    <div className="max-h-[75vh] overflow-y-auto overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/80 sticky top-0 z-20 backdrop-blur">
                                <TableRow>
                                    <TableHead className="min-w-[250px]">Resource & Current Info</TableHead>
                                    <TableHead className="min-w-[200px]">New Subject</TableHead>
                                    <TableHead className="min-w-[200px]">New Chapter</TableHead>
                                    <TableHead className="text-right w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orphanedResources.map(res => {
                                    const classKey = String(res.class);
                                    const subjects = Object.keys(syllabus[classKey] || {});
                                    const selectedSubject = pendingChanges[res.id]?.subject || "";
                                    const chapters = getChaptersForSubject(classKey, selectedSubject);

                                    return (
                                        <TableRow key={res.id} className="hover:bg-accent/5 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold bg-primary/5">Cl {res.class}</Badge>
                                                        <span className="font-bold text-sm line-clamp-1">{res.title}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-1">
                                                        <div className="flex items-center text-[10px] text-destructive/80 font-medium bg-destructive/5 px-2 py-0.5 rounded">
                                                            <BookOpen className="w-3 h-3 mr-1" /> {res.subject}
                                                        </div>
                                                        <div className="flex items-center text-[10px] text-destructive/80 font-medium bg-destructive/5 px-2 py-0.5 rounded">
                                                            <Bookmark className="w-3 h-3 mr-1" /> {res.chapter}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={selectedSubject} 
                                                    onValueChange={(val) => setPendingChanges(prev => ({ 
                                                        ...prev, 
                                                        [res.id]: { subject: val, chapter: "" } 
                                                    }))}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Select Subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    disabled={!selectedSubject}
                                                    value={pendingChanges[res.id]?.chapter || ""} 
                                                    onValueChange={(val) => setPendingChanges(prev => ({ 
                                                        ...prev, 
                                                        [res.id]: { ...prev[res.id], chapter: val } 
                                                    }))}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Select Chapter" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="icon" 
                                                    variant="default"
                                                    className="h-9 w-9"
                                                    disabled={updatingId === res.id || !pendingChanges[res.id]?.chapter}
                                                    onClick={() => handleQuickUpdate(res.id)}
                                                >
                                                    {updatingId === res.id ? (
                                                        <Loader className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {orphanedResources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-green-500/10 rounded-full">
                                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-bold">Great Job!</h3>
                                                    <p className="text-muted-foreground">All resources are perfectly mapped to the current syllabus.</p>
                                                </div>
                                                <Button asChild variant="outline" className="mt-4">
                                                    <Link href="/admin/dashboard">Go to Manage Content</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
            {isAutoFixing && <LoadingOverlay isLoading={true} />}
        </div>
    );
}
