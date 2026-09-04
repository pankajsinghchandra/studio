
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    limit, 
    startAfter, 
    type DocumentData, 
    type DocumentSnapshot
} from 'firebase/firestore';
import type { UserActivity } from '@/lib/types';
import LoadingOverlay from '@/components/loading-overlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader, ChevronRight, Clock, User, AlertCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 25;
const ADMIN_EMAIL = 'quizpankaj@gmail.com';

interface UserForFilter {
    uid: string;
    email: string | null;
    name: string | null;
}

export default function UserActivityPage() {
    const { user, userDetails, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [users, setUsers] = useState<UserForFilter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedTime, setSelectedTime] = useState('all');

    const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
    const [isLastPage, setIsLastPage] = useState(false);
    const [page, setPage] = useState(1);
    
    const isFetching = useRef(false);

    // Initial check and fetch users
    useEffect(() => {
        if (!authLoading) {
            if (!user || userDetails?.email !== ADMIN_EMAIL) {
                router.replace('/');
            } else {
                const fetchUsersList = async () => {
                    try {
                        const usersSnapshot = await getDocs(collection(db, 'users'));
                        const usersList = usersSnapshot.docs
                            .map(doc => ({ 
                                uid: doc.id, 
                                email: doc.data().email as string | null,
                                name: doc.data().name as string | null 
                            }))
                            .filter(u => u.email !== ADMIN_EMAIL);
                        setUsers(usersList);
                    } catch (err) {
                        console.error("Error fetching users:", err);
                    }
                };
                fetchUsersList();
            }
        }
    }, [user, userDetails, authLoading, router]);

    const fetchActivities = useCallback(async (isReset: boolean = false) => {
        if (!user || userDetails?.email !== ADMIN_EMAIL || isFetching.current) return;
        
        isFetching.current = true;
        setIsLoading(true);
        setError(null);
        
        try {
            let q = query(collection(db, "user-activity"));

            // Dynamic Query Building
            if (selectedUser !== 'all') {
                q = query(q, where('userId', '==', selectedUser));
            }

            if (selectedTime !== 'all') {
                const now = new Date();
                let startDate;
                if (selectedTime === '24h') startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                else if (selectedTime === '3d') startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                else if (selectedTime === 'weekly') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                else if (selectedTime === 'monthly') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                if (startDate) {
                    q = query(q, where('timestamp', '>=', startDate));
                }
            }
            
            // Note: If filtering and sorting on different fields, Firestore needs a composite index.
            // Default to timestamp desc for general view.
            if (selectedUser === 'all' && selectedTime === 'all') {
                q = query(q, orderBy('timestamp', 'desc'));
            }

            // Pagination
            if (!isReset && page > 1 && lastVisible) {
                q = query(q, startAfter(lastVisible));
            }
            
            q = query(q, limit(PAGE_SIZE));

            const docSnapshots = await getDocs(q);
            const fetchedActivities = docSnapshots.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as UserActivity))
                .filter(a => a.userEmail !== ADMIN_EMAIL);
            
            setActivities(fetchedActivities);
            setLastVisible(docSnapshots.docs[docSnapshots.docs.length - 1] || null);
            setIsLastPage(docSnapshots.docs.length < PAGE_SIZE);

        } catch (err: any) {
            console.error("Firestore Fetch Error:", err);
            setError("Could not fetch activities. This might be due to missing database indexes or high data load.");
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [selectedUser, selectedTime, page, user, userDetails, lastVisible]);

    // Trigger fetch on filter change
    useEffect(() => {
        if (!authLoading && user && userDetails?.email === ADMIN_EMAIL) {
            fetchActivities(true);
        }
    }, [selectedUser, selectedTime]); // Dependencies are ONLY filters to trigger reset

    // Pagination trigger
    const handleNextPage = () => {
        if (!isLastPage && !isLoading) setPage(p => p + 1);
    };

    const handlePrevPage = () => {
        if (page > 1 && !isLoading) setPage(p => p - 1);
    }

    const handleReset = () => {
        setPage(1);
        setLastVisible(null);
        setSelectedUser('all');
        setSelectedTime('all');
    };

    const formatDuration = (seconds: number = 0) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getResourceTypeLabel = (type?: string) => {
        if (!type) return 'Resource';
        if (type === 'mind-map-json') return 'Mind Map';
        if (type === 'lesson-plan-text') return 'Lesson Plan';
        if (type === 'pdf-note') return 'PDF Note';
        if (type === 'translated-chapter') return 'Translated Chapter';
        return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (authLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-foreground">
                        User Activity Logs
                    </h1>
                    <p className="text-muted-foreground mt-1">Track student engagement and resource usage.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchActivities(true)}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <User className="w-4 h-4 mr-2" /> Filter by Student
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedUser} onValueChange={(val) => { setSelectedUser(val); setPage(1); setLastVisible(null); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Students</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.uid} value={u.uid}>{u.name || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Clock className="w-4 h-4 mr-2" /> Time Range
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedTime} onValueChange={(val) => { setSelectedTime(val); setPage(1); setLastVisible(null); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="3d">Last 3 Days</SelectItem>
                                <SelectItem value="weekly">Last 7 Days</SelectItem>
                                <SelectItem value="monthly">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[180px]">Student</TableHead>
                            <TableHead>Resource & Type</TableHead>
                            <TableHead>Hierarchy</TableHead>
                            <TableHead>Time Spent</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-muted-foreground">Loading activities...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : activities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                    No activity logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            activities.map(activity => (
                                <TableRow key={activity.id} className="hover:bg-accent/5 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground text-sm">{activity.userName}</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{activity.userEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-sm line-clamp-1">{activity.resourceTitle}</span>
                                            <Badge variant="secondary" className="w-fit text-[10px] py-0 px-2 h-5 bg-primary/10 text-primary border-none">
                                                {getResourceTypeLabel(activity.resourceType)}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 h-4">Cl {activity.resourceClass}</Badge>
                                            <Badge variant="secondary" className="text-[9px] py-0 px-1 h-4">{activity.resourceSubject}</Badge>
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 italic">{activity.resourceChapter}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-mono text-primary font-bold text-xs">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(activity.durationSeconds)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                                        {activity.timestamp ? format(activity.timestamp.toDate(), 'PPpp') : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
            
            <div className="flex items-center justify-between py-6">
                <p className="text-xs text-muted-foreground">
                    Showing {activities.length} logs
                </p>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleReset} disabled={page <= 1 && selectedUser === 'all' && selectedTime === 'all'}>
                        Reset
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={page <= 1 || isLoading}>
                            <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        <div className="bg-muted px-3 py-1 rounded-md text-xs font-medium">
                            Page {page}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={isLastPage || isLoading}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
