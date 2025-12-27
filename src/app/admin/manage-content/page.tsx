'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingOverlay from '@/components/loading-overlay';

export default function ManageContentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [resourceClass, setResourceClass] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!loading && (!user || user.email !== 'quizpankaj@gmail.com')) {
    router.replace('/');
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);

    try {
      let resourceUrl = '';

      if (type === 'video') {
        resourceUrl = videoLink;
      } else if (file) {
        const storage = getStorage();
        const fileId = uuidv4();
        const storageRef = ref(storage, `resources/${fileId}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        resourceUrl = await getDownloadURL(snapshot.ref);
      }

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
        description: 'There was a problem with your request.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LoadingOverlay isLoading={loading || isUploading} />
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
                <Input id="class" placeholder="e.g., 6" required value={resourceClass} onChange={(e) => setResourceClass(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g., Mathematics" required value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Input id="chapter" placeholder="e.g., Algebra Basics" required value={chapter} onChange={(e) => setChapter(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select onValueChange={setType} required>
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
            {type === 'video' ? (
              <div className="space-y-2">
                <Label htmlFor="videoLink">Video Link</Label>
                <Input id="videoLink" type="url" placeholder="https://www.youtube.com/watch?v=..." required value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
              </div>
            ) : (
              type && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <Input id="file" type="file" required onChange={handleFileChange} />
                </div>
              )
            )}
            <Button className="w-full" type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Add Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
