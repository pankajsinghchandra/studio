
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
import { ArrowLeft, AlertCircle, Save, CheckCircle2, RefreshCcw, Loader } from 'lucide-react';
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
    
    // Track local selections for each orphaned resource
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
        } finally {
            setIsLoading(false);
        }
    };

    const normalizeName = (text: string) => {
        if (!text) return "";
        return text.replace(/^[0-9\.\-\s]+/, '').trim().toLowerCase();
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
            
            // Remove from list locally
            setResources(prev => prev.filter(r => r.id !== resId));
            const newPending = { ...pendingChanges };
            delete newPending[resId];
            setPendingChanges(newPending);
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
        
        // Handle nested categories (like Science)
        let flatChapters: string[] = [];
        Object.values(subData).forEach((list: any) => {
            if (Array.isArray(list)) flatChapters = [...flatChapters, ...list];
        });
        return flatChapters.sort();
    };

    if (loading || isLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-foreground flex items-center gap-3">
                        Quick Repair Tool
                        <Badge variant="outline" className="text-sm font-normal">Fast-Fix Enabled</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Directly map {orphanedResources.length} items to new subjects/chapters.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchResources}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh List
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
                             <AlertCircle className="w-10 h-10 text-destructive" />
                        ) : (
                             <CheckCircle2 className="w-10 h-10 text-green-500" />
                        )}
                        <div className="flex-1">
                            <CardTitle className="text-xl">Status: {orphanedResources.length} Broken Items</CardTitle>
                            <CardDescription>
                                Select the correct Subject and Chapter below, then click the Save icon to fix each item instantly.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="overflow-hidden border-border/60">
                    <div className="max-h-[70vh] overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[200px]">Resource Details</TableHead>
                                    <TableHead className="w-[250px]">New Subject</TableHead>
                                    <TableHead className="w-[250px]">New Chapter</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orphanedResources.map(res => {
                                    const classKey = String(res.class);
                                    const subjects = Object.keys(syllabus[classKey] || {});
                                    const selectedSubject = pendingChanges[res.id]?.subject || "";
                                    const chapters = getChaptersForSubject(classKey, selectedSubject);

                                    return (
                                        <TableRow key={res.id} className="hover:bg-accent/5">
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-xs line-clamp-1">{res.title}</span>
                                                    <div className="flex gap-1">
                                                        <Badge variant="outline" className="text-[9px] py-0">Cl {res.class}</Badge>
                                                        <Badge variant="destructive" className="text-[9px] py-0 italic opacity-70">{res.chapter}</Badge>
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
                                                    <SelectTrigger className="h-8 text-xs">
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
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select Chapter" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="default"
                                                    className="h-8 w-8 p-0"
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
                                        <TableCell colSpan={4} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                                                <h3 className="text-xl font-bold">All items fixed!</h3>
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
