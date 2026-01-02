'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingOverlay from '@/components/loading-overlay';
import { syllabus } from '@/lib/syllabus';

const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
};


export default function ManageContentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [resourceClass, setResourceClass] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjects = useMemo(() => {
    return resourceClass ? Object.keys(syllabus[resourceClass as keyof typeof syllabus] || {}) : [];
  }, [resourceClass]);

  const chapters = useMemo(() => {
    if (resourceClass && subject) {
      const classSyllabus = syllabus[resourceClass as keyof typeof syllabus];
      return classSyllabus ? classSyllabus[subject as keyof typeof classSyllabus] || [] : [];
    }
    return [];
  }, [resourceClass, subject]);


  useEffect(() => {
      if (!loading && (!user || user.email !== 'quizpankaj@gmail.com')) {
        router.replace('/');
      }
  }, [user, loading, router]);


  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !resourceClass || !subject || !chapter || !type || !resourceUrl) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out all required fields.',
        });
        return;
    }

    if (!isValidUrl(resourceUrl)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Link',
            description: 'Please enter a valid URL.',
        });
        return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'resources'), {
        title,
        class: resourceClass,
        subject,
        chapter,
        type,
        url: resourceUrl,
        authorId: user.uid,
        createdAt: new Date(),
      });

      toast({
        title: 'Success!',
        description: 'Resource has been added successfully.',
      });
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: (error as Error).message || 'There was a problem with your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LoadingOverlay isLoading={isSubmitting} />
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Add New Content</CardTitle>
            <CardDescription>Fill in the details to upload a new resource.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g., Introduction to Algebra" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select onValueChange={value => { setResourceClass(value); setSubject(''); setChapter(''); }} required value={resourceClass}>
                        <SelectTrigger id="class"><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(syllabus).sort((a, b) => parseInt(a) - parseInt(b)).map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={value => { setSubject(value); setChapter(''); }} required value={subject} disabled={!resourceClass}>
                        <SelectTrigger id="subject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter</Label>
                    <Select onValueChange={setChapter} required value={chapter} disabled={!subject}>
                        <SelectTrigger id="chapter"><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                        <SelectContent>
                            {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select onValueChange={setType} required value={type}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson-plan-pdf">Lesson Plan (PDF)</SelectItem>
                  <SelectItem value="lesson-plan-word">Lesson Plan (Word)</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="infographic">Infographic (Image)</SelectItem>
                  <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                  <SelectItem value="pdf-note">PDF Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resourceUrl">Resource Link</Label>
              <Input id="resourceUrl" type="url" placeholder="https://example.com/resource" required value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Add Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
