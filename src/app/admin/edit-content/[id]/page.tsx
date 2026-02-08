'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/app/providers';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingOverlay from '@/components/loading-overlay';
import { syllabus } from '@/lib/syllabus';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/rich-text-editor';


const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
};

const isValidJson = (str: string): boolean => {
    if (!str) return true;
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};


export default function EditContentPage() {
  const { user, loading: authLoading, userDetails } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id: resourceId } = params as { id: string };
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [resourceClass, setResourceClass] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [jsonError, setJsonError] = useState('');

  const subjects = useMemo(() => {
    return resourceClass ? Object.keys(syllabus[resourceClass as keyof typeof syllabus] || {}) : [];
  }, [resourceClass]);

  const chapters = useMemo(() => {
    if (resourceClass && subject) {
      const classSyllabus = syllabus[resourceClass as keyof typeof syllabus];
      return classSyllabus ? (classSyllabus as any)[subject] || [] : [];
    }
    return [];
  }, [resourceClass, subject]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || userDetails?.email !== 'quizpankaj@gmail.com') {
      router.replace('/');
      return;
    }
    
    if (resourceId) {
        const fetchResource = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'resources', resourceId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title);
                    setResourceClass(data.class);
                    setSubject(data.subject);
                    setChapter(data.chapter);
                    setType(data.type);

                    const isText = data.type === 'lesson-plan-text';
                    const isJson = data.type === 'mind-map-json';
                    const content = data.url || '';

                    if (isText) {
                        // If content has no HTML tags, it's likely old plain text. Convert it.
                        if (content && !/<[a-z][\s\S]*>/i.test(content)) {
                            const html = content
                                .split('\n')
                                .map((line: string) => line.trim() === '' ? '<p><br></p>' : `<p>${line}</p>`)
                                .join('');
                            setHtmlContent(html);
                        } else {
                            setHtmlContent(content);
                        }
                    } else if (isJson) {
                        setHtmlContent(content)
                    } else {
                        setResourceUrl(content);
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Resource not found.' });
                    router.push('/admin/dashboard');
                }
            } catch (error) {
                console.error("Error fetching resource:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch resource data.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchResource();
    }
  }, [resourceId, user, authLoading, router, userDetails, toast]);
  
  
  useEffect(() => {
    if (type === 'mind-map-json') {
      if (!isValidJson(htmlContent)) {
        setJsonError('The content is not valid JSON. Please check the format.');
      } else {
        setJsonError('');
      }
    } else {
      setJsonError('');
    }
  }, [htmlContent, type]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid .json file.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlContent(content);
        if (isValidJson(content)) {
          toast({ title: 'File Uploaded', description: 'The JSON content has been loaded.' });
        } else {
          toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The file content is not valid JSON.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const isTextContent = type === 'lesson-plan-text';
    const isJsonContent = type === 'mind-map-json';

    if (isJsonContent && !isValidJson(htmlContent)) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: jsonError || 'The mind map content is not valid JSON.' });
        return;
    }
    
    if (!(isTextContent || isJsonContent) && !isValidUrl(resourceUrl)) {
        toast({ variant: 'destructive', title: 'Invalid Link', description: 'Please enter a valid URL.' });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const docRef = doc(db, 'resources', resourceId);
      await updateDoc(docRef, {
        title,
        class: resourceClass,
        subject,
        chapter,
        type,
        url: isTextContent || isJsonContent ? htmlContent : resourceUrl,
      });

      toast({
        title: 'Success!',
        description: 'Resource has been updated successfully.',
        duration: 1500,
      });
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: (error as Error).message || 'There was a problem with your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  const isTextContent = type === 'lesson-plan-text';
  const isJsonContent = type === 'mind-map-json';

  return (
    <div className="container mx-auto px-4 py-8">
       <LoadingOverlay isLoading={isSubmitting} />
       <header className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          Edit Content
        </h1>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manage Content
          </Link>
        </Button>
      </header>
      <Card className="w-full max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Edit Resource</CardTitle>
            <CardDescription>Update the details of the resource below.</CardDescription>
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
                  <SelectItem value="lesson-plan-image">Lesson Plan (Image)</SelectItem>
                  <SelectItem value="lesson-plan-text">Lesson Plan (Text)</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="infographic">Infographic (Image)</SelectItem>
                  <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                  <SelectItem value="mind-map-json">Mind Map (JSON)</SelectItem>
                  <SelectItem value="pdf-note">PDF Note</SelectItem>
                  <SelectItem value="translated-chapter">Translated Chapter (PDF)</SelectItem>
                  <SelectItem value="song">Song (Video/Audio URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isTextContent ? (
                <div className="space-y-2">
                    <Label>Lesson Content</Label>
                    <RichTextEditor content={htmlContent} onChange={setHtmlContent} />
                </div>
            ) : isJsonContent ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="jsonContent">Mind Map JSON Content</Label>
                         <>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload JSON
                            </Button>
                        </>
                    </div>
                    <Textarea 
                        id="jsonContent" 
                        placeholder={'Paste your mind map JSON here, or upload a file.'}
                        required 
                        value={htmlContent} 
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                    />
                    {jsonError && <p className="text-sm text-destructive mt-1">{jsonError}</p>}
                </div>
            ) : (
                <div className="space-y-2">
                  <Label htmlFor="resourceUrl">Resource Link</Label>
                  <Input 
                    id="resourceUrl" 
                    type="url" 
                    placeholder="https://example.com/resource" 
                    required={!isTextContent && !isJsonContent}
                    value={resourceUrl} 
                    onChange={(e) => setResourceUrl(e.target.value)} 
                  />
                </div>
            )}

            <Button className="w-full mt-6" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
