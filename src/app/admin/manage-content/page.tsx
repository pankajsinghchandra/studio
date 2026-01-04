'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud } from 'lucide-react';
import Link from 'next/link';

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
    if (!str) return true; // Empty is valid until submission
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};


export default function ManageContentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [resourceClass, setResourceClass] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (type === 'mind-map-json') {
      if (!isValidJson(textContent)) {
        setJsonError('The content is not valid JSON. Please check the format.');
      } else {
        setJsonError('');
      }
    } else {
      setJsonError('');
    }
  }, [textContent, type]);


  useEffect(() => {
      if (!loading && (!user || user.email !== 'quizpankaj@gmail.com')) {
        router.replace('/');
      }
  }, [user, loading, router]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid .json file.',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextContent(content);
        if (isValidJson(content)) {
          toast({
            title: 'File Uploaded',
            description: 'The JSON content has been loaded into the text area.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid JSON',
            description: 'The content of the file is not valid JSON.',
          });
        }
      };
      reader.readAsText(file);
    }
  };


  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const isTextPlan = type === 'lesson-plan-text';
    const isMindMap = type === 'mind-map-json';
    const isUrlPlan = !isTextPlan && !isMindMap;

    if (!title || !resourceClass || !subject || !chapter || !type) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out all required fields.',
        });
        return;
    }

    if (isUrlPlan && !isValidUrl(resourceUrl)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Link',
            description: 'Please enter a valid URL for this resource type. It must start with http:// or https://',
        });
        return;
    }

    if ((isTextPlan || isMindMap) && !textContent.trim()) {
        toast({
            variant: 'destructive',
            title: 'Missing Content',
            description: `Please enter the content for the ${isMindMap ? 'mind map' : 'lesson plan'}.`,
        });
        return;
    }

    if (isMindMap && !isValidJson(textContent)) {
        toast({
            variant: 'destructive',
            title: 'Invalid JSON',
            description: jsonError || 'The mind map content is not valid JSON. Please check the format.',
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
        url: isUrlPlan ? resourceUrl : textContent,
        authorId: user.uid,
        createdAt: new Date(),
      });

      toast({
        title: 'Success!',
        description: 'Resource has been added successfully.',
        duration: 1500,
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

  const isTextOrJsonContent = type === 'lesson-plan-text' || type === 'mind-map-json';

  return (
    <div className="container mx-auto px-4 py-8">
       <LoadingOverlay isLoading={isSubmitting} />
       <header className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          Add New Content
        </h1>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </header>
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">New Resource</CardTitle>
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
                  <SelectItem value="lesson-plan-image">Lesson Plan (Image)</SelectItem>
                  <SelectItem value="lesson-plan-text">Lesson Plan (Text)</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="infographic">Infographic (Image)</SelectItem>
                  <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                  <SelectItem value="mind-map-json">Mind Map (JSON)</SelectItem>
                  <SelectItem value="pdf-note">PDF Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isTextOrJsonContent ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="textContent">{type === 'mind-map-json' ? 'Mind Map JSON Content' : 'Lesson Content'}</Label>
                        {type === 'mind-map-json' && (
                            <>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept=".json"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Upload JSON File
                                </Button>
                            </>
                        )}
                    </div>
                    <Textarea 
                        id="textContent" 
                        placeholder={type === 'mind-map-json' ? 'Paste your mind map JSON here, or upload a file.' : 'Type your lesson plan content here...'}
                        required 
                        value={textContent} 
                        onChange={(e) => setTextContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
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
                    required={!isTextOrJsonContent}
                    value={resourceUrl} 
                    onChange={(e) => setResourceUrl(e.target.value)} 
                  />
                </div>
            )}


            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Add Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
