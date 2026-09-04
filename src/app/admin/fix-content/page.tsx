
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
import { ArrowLeft, AlertCircle, Pencil, Zap, CheckCircle2, Loader } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function FixContentPage() {
    const { user, userDetails, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoFixing, setIsAutoFixing] = useState(false);

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

    const orphanedResources = useMemo(() => {
        return resources.filter(res => {
            const classKey = String(res.class);
            const classData = syllabus[classKey];
            if (!classData) return true;
            
            const subjectData = classData[res.subject];
            if (!subjectData) return true;

            const targetChapter = res.chapter?.trim();
            if (Array.isArray(subjectData)) {
                return !subjectData.map(c => c.trim()).includes(targetChapter);
            } else {
                let found = false;
                Object.values(subjectData).forEach((chapters: any) => {
                    if (chapters.map((c: string) => c.trim()).includes(targetChapter)) found = true;
                });
                return !found;
            }
        });
    }, [resources]);

    const handleSmartFix = async () => {
        if (orphanedResources.length === 0) return;
        if (!window.confirm(`Attempt to auto-fix ${orphanedResources.length} items? This will search for matching chapter names across all subjects in the same class.`)) return;
        
        setIsAutoFixing(true);
        let fixedCount = 0;

        try {
            for (const res of orphanedResources) {
                const classKey = String(res.class);
                const classData = syllabus[classKey];
                if (!classData) continue;

                let foundSubject = '';
                const targetChapter = res.chapter?.trim();

                // Search all subjects in this class for the exact chapter name
                for (const subName in classData) {
                    const subData = classData[subName];
                    if (Array.isArray(subData)) {
                        if (subData.map(c => c.trim()).includes(targetChapter)) {
                            foundSubject = subName;
                            break;
                        }
                    } else {
                        // Nested Science/English/Hindi categories
                        for (const catName in subData) {
                            const chapters = subData[catName] as string[];
                            if (chapters.map(c => c.trim()).includes(targetChapter)) {
                                foundSubject = subName;
                                break;
                            }
                        }
                    }
                    if (foundSubject) break;
                }

                if (foundSubject) {
                    await updateDoc(doc(db, 'resources', res.id), {
                        subject: foundSubject
                    });
                    fixedCount++;
                }
            }
            
            toast({
                title: "Auto-Fix Complete",
                description: `Successfully re-mapped ${fixedCount} out of ${orphanedResources.length} resources.`,
            });
            fetchResources();
        } catch (error) {
            console.error("Smart Fix Error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Batch update failed. Please try again." });
        } finally {
            setIsAutoFixing(false);
        }
    };

    if (loading || isLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-foreground">Content Mapping Tool</h1>
                    <p className="text-muted-foreground mt-1">Resources that don't match the current syllabus names.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="default" 
                        className="bg-orange-500 hover:bg-orange-600" 
                        onClick={handleSmartFix}
                        disabled={isAutoFixing || orphanedResources.length === 0}
                    >
                        {isAutoFixing ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                        Smart Auto-Fix All
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
                    </Button>
                </div>
            </header>

            <div className="grid gap-6">
                <Card className={orphanedResources.length > 0 ? "border-destructive/20 bg-destructive/5" : "border-green-500/20 bg-green-50/50"}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        {orphanedResources.length > 0 ? (
                             <AlertCircle className="w-8 h-8 text-destructive" />
                        ) : (
                             <CheckCircle2 className="w-8 h-8 text-green-500" />
                        )}
                        <div>
                            <CardTitle>Orphaned Resources Detected: {orphanedResources.length}</CardTitle>
                            <CardDescription>
                                {orphanedResources.length > 0 
                                    ? "These items were not found in the current syllabus. Use 'Smart Fix' to automatically map chapters with matching names."
                                    : "All resources are currently mapped correctly to the syllabus."}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Current Data (Class > Sub > Ch)</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orphanedResources.map(res => (
                                <TableRow key={res.id}>
                                    <TableCell className="font-medium">{res.title}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline">Class {res.class}</Badge>
                                            <Badge variant="secondary">{res.subject}</Badge>
                                            <Badge variant="destructive" className="italic">{res.chapter}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" asChild variant="default">
                                            <Link href={`/admin/edit-content/${res.id}?from=fix-tool`}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Fix Mapping
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {orphanedResources.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                                            <p className="text-lg">Great! All resources are correctly mapped.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
