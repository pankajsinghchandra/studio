
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import type { Resource } from '@/lib/types';
import { syllabus } from '@/lib/syllabus';
import LoadingOverlay from '@/components/loading-overlay';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertCircle, Pencil, Zap, CheckCircle2, Loader, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function FixContentPage() {
    const { user, userDetails, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoFixing, setIsAutoFixing] = useState(false);
    const [fixProgress, setFixProgress] = useState({ current: 0, total: 0 });

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
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to clean chapter names for better matching
    const normalizeName = (text: string) => {
        if (!text) return "";
        return text
            .replace(/^[0-9\.\-\s]+/, '') // Remove leading numbers and dots (e.g. "1. ")
            .replace(/^अध्याय\s+[0-9\:\-\s]+/, '') // Remove "अध्याय 1:"
            .replace(/^Prose\s+[0-9\:\-\s]+/, '') // Remove "Prose 1:"
            .replace(/^Poetry\s+[0-9\:\-\s]+/, '') // Remove "Poetry 1:"
            .replace(/[\*\(\)]/g, '') // Remove asterisks and brackets
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
            
            // Check in standard subjects
            if (Array.isArray(subjectData)) {
                return !subjectData.some(c => normalizeName(c) === targetChapter);
            } else {
                // Check in nested objects (like Science or English/Hindi sections)
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

    const handleSmartFix = async () => {
        if (orphanedResources.length === 0) return;
        if (!window.confirm(`Attempt to fuzzy-match and auto-fix ${orphanedResources.length} items? This will search across all subjects in the same class.`)) return;
        
        setIsAutoFixing(true);
        setFixProgress({ current: 0, total: orphanedResources.length });
        let fixedCount = 0;

        try {
            for (const res of orphanedResources) {
                const classKey = String(res.class);
                const classData = syllabus[classKey];
                if (!classData) continue;

                let foundSubject = '';
                let foundChapterExact = '';
                const dbChapterNormalized = normalizeName(res.chapter);

                // Search all subjects in this class
                for (const subName in classData) {
                    const subData = classData[subName];
                    
                    if (Array.isArray(subData)) {
                        const match = subData.find(c => normalizeName(c) === dbChapterNormalized);
                        if (match) {
                            foundSubject = subName;
                            foundChapterExact = match;
                            break;
                        }
                    } else {
                        // Nested Categories
                        for (const catName in subData) {
                            const chapters = subData[catName] as string[];
                            const match = chapters.find(c => normalizeName(c) === dbChapterNormalized);
                            if (match) {
                                foundSubject = subName;
                                foundChapterExact = match;
                                break;
                            }
                        }
                    }
                    if (foundSubject) break;
                }

                if (foundSubject && foundChapterExact) {
                    await updateDoc(doc(db, 'resources', res.id), {
                        subject: foundSubject,
                        chapter: foundChapterExact // Also update to exact name from syllabus
                    });
                    fixedCount++;
                }
                setFixProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
            
            toast({
                title: "Auto-Fix Complete",
                description: `Successfully re-mapped ${fixedCount} out of ${orphanedResources.length} resources.`,
            });
            fetchResources();
        } catch (error) {
            console.error("Smart Fix Error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Batch update failed." });
        } finally {
            setIsAutoFixing(false);
        }
    };

    if (loading || isLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-foreground flex items-center gap-3">
                        Content Repair Tool
                        <Badge variant="outline" className="text-sm font-normal">Super Smart v2</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Found {orphanedResources.length} items that need fixing.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="default" 
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-orange-200 shadow-lg" 
                        onClick={handleSmartFix}
                        disabled={isAutoFixing || orphanedResources.length === 0}
                    >
                        {isAutoFixing ? (
                            <><Loader className="animate-spin mr-2 h-4 w-4" /> {fixProgress.current}/{fixProgress.total} Fixing...</>
                        ) : (
                            <><Zap className="mr-2 h-4 w-4 fill-current" /> Fuzzy Auto-Fix All</>
                        )}
                    </Button>
                    <Button variant="outline" onClick={fetchResources} disabled={isAutoFixing}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
                    </Button>
                </div>
            </header>

            <div className="grid gap-6">
                <Card className={orphanedResources.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-green-500/30 bg-green-50/50"}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        {orphanedResources.length > 0 ? (
                             <AlertCircle className="w-10 h-10 text-destructive animate-pulse" />
                        ) : (
                             <CheckCircle2 className="w-10 h-10 text-green-500" />
                        )}
                        <div className="flex-1">
                            <CardTitle className="text-xl">Status Report</CardTitle>
                            <CardDescription className="text-base">
                                {orphanedResources.length > 0 
                                    ? `There are ${orphanedResources.length} resources with names that don't match the new syllabus (possibly due to numbering like "1." or "अध्याय 1:").`
                                    : "Perfect! All 700+ resources are correctly mapped to your syllabus."}
                            </CardDescription>
                        </div>
                        {orphanedResources.length > 0 && (
                            <div className="hidden md:block text-right px-4">
                                <p className="text-3xl font-bold text-destructive">{orphanedResources.length}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Broken Items</p>
                            </div>
                        )}
                    </CardHeader>
                </Card>

                <Card className="overflow-hidden border-border/60">
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[300px]">Resource Title</TableHead>
                                    <TableHead>Location in Database</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orphanedResources.map(res => (
                                    <TableRow key={res.id} className="hover:bg-accent/5">
                                        <TableCell className="font-medium">{res.title}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge variant="outline" className="bg-background">Class {res.class}</Badge>
                                                <Badge variant="secondary">{res.subject}</Badge>
                                                <Badge variant="destructive" className="italic bg-destructive/10 border-destructive/20">{res.chapter}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                                                <Link href={`/admin/edit-content/${res.id}?from=fix-tool`}>
                                                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                                    Fix
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orphanedResources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-green-50 rounded-full border border-green-100">
                                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground">Clean Sweep!</h3>
                                                <p className="text-muted-foreground max-w-md mx-auto">
                                                    All your teaching materials are correctly linked to the chapters in the current syllabus.
                                                </p>
                                                <Button asChild variant="outline" className="mt-2">
                                                    <Link href="/admin/dashboard">Go to Dashboard</Link>
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
        </div>
    );
}

