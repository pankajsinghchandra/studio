'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit, startAfter, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { UserActivity } from '@/lib/types';
import LoadingOverlay from '@/components/loading-overlay';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

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
    
    // Filter states
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedTime, setSelectedTime] = useState('all');

    // Pagination states
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
    const [isLastPage, setIsLastPage] = useState(false);
    const [page, setPage] = useState(1);
    
    useEffect(() => {
        if (!authLoading) {
            if (!user || userDetails?.email !== 'quizpankaj@gmail.com') {
                router.replace('/');
            } else {
                fetchUsers();
            }
        }
    }, [user, userDetails, authLoading, router]);

    const fetchUsers = async () => {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ 
            uid: doc.id, 
            email: doc.data().email as string | null,
            name: doc.data().name as string | null 
        }));
        setUsers(usersList);
    };

    const fetchActivities = useCallback(async (nextPage = false) => {
        setIsLoading(true);

        try {
            let q = query(collection(db, 'user-activity'), orderBy('timestamp', 'desc'));

            // Apply filters
            if (selectedUser !== 'all') {
                q = query(q, where('userId', '==', selectedUser));
            }
            if (selectedTime !== 'all') {
                const now = new Date();
                let startDate: Date;
                if (selectedTime === 'weekly') {
                    startDate = new Date(now.setDate(now.getDate() - 7));
                } else { // monthly
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                }
                q = query(q, where('timestamp', '>=', startDate));
            }

            // Apply pagination
            if (nextPage && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const finalQuery = query(q, limit(PAGE_SIZE));
            const docSnapshots = await getDocs(finalQuery);

            const fetchedActivities = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserActivity));

            setActivities(fetchedActivities);

            // Update pagination state
            setLastDoc(docSnapshots.docs[docSnapshots.docs.length - 1] || null);
            setIsLastPage(docSnapshots.docs.length < PAGE_SIZE);

        } catch (error) {
            console.error("Error fetching user activities:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedUser, selectedTime, lastDoc]);

    // Effect to refetch data when filters change
    useEffect(() => {
        // Reset pagination and fetch
        setLastDoc(null);
        setPage(1);
        setIsLastPage(false);
        fetchActivities(false);
    }, [selectedUser, selectedTime]);
    
    const handleNextPage = () => {
        if (!isLastPage) {
            setPage(p => p + 1);
            fetchActivities(true);
        }
    }

    // Since we don't have a reliable 'previous' query in Firestore without complex logic,
    // we'll just reset to the first page.
    const handlePrevPage = () => {
         // A simple way to go "back" is to just re-run the initial query for the current filters
        setLastDoc(null);
        setPage(1);
        fetchActivities(false);
    }

    if (authLoading || !user) {
        return <LoadingOverlay isLoading={true} />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="font-headline text-4xl font-bold text-foreground">
                    User Activity
                </h1>
                <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>

            <Card className="mb-8">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="user-filter">Filter by User</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger id="user-filter">
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.uid} value={u.uid}>{u.name || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="time-filter">Filter by Time</Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                            <SelectTrigger id="time-filter">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="weekly">Last 7 Days</SelectItem>
                                <SelectItem value="monthly">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Resource Title</TableHead>
                            <TableHead>Context (Class/Subject/Chapter)</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader className="h-5 w-5 animate-spin" />
                                        <span>Loading activities...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && activities.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No activities found for the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && activities.map(activity => (
                            <TableRow key={activity.id}>
                                <TableCell>
                                    <div className="font-medium">{activity.userName}</div>
                                    <div className="text-sm text-muted-foreground">{activity.userEmail}</div>
                                </TableCell>
                                <TableCell>{activity.resourceTitle}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {`Cl ${activity.resourceClass} > ${activity.resourceSubject} > ${activity.resourceChapter}`}
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                    {activity.timestamp ? format(activity.timestamp.toDate(), 'PPpp') : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4 mr-1"/>
                    First Page
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={isLastPage}>
                    Next Page
                    <ChevronRight className="h-4 w-4 ml-1"/>
                </Button>
            </div>

        </div>
    );
}
