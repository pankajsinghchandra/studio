import { notFound } from 'next/navigation';
import { data } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Breadcrumb from '@/components/breadcrumb';
import { FileText } from 'lucide-react';

export async function generateStaticParams() {
    const paths = [];
    for (const classData of data) {
        for (const subject of classData.subjects) {
            paths.push({ classId: classData.id, subjectId: subject.id });
        }
    }
    return paths;
}

export default function SubjectPage({ params }: { params: { classId: string; subjectId: string } }) {
  const classData = data.find((c) => c.id === params.classId);
  const subject = classData?.subjects.find((s) => s.id === params.subjectId);

  if (!classData || !subject) {
    notFound();
  }

  const breadcrumbItems = [
    { href: '/', label: 'Home' },
    { href: `/${classData.id}`, label: classData.name },
    { href: `/${classData.id}/${subject.id}`, label: subject.name },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <header className="mb-8 flex items-center gap-4">
        <subject.icon className="w-12 h-12 text-primary" />
        <div>
            <h1 className="font-headline text-4xl font-bold text-foreground">
            {subject.name}
            </h1>
            <p className="text-lg text-muted-foreground">Select a lesson to start learning.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subject.lessons.map((lesson) => (
          <Link href={`/${classData.id}/${subject.id}/${lesson.id}`} key={lesson.id} className="block transition-transform duration-300 hover:-translate-y-1">
                <Card className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <FileText className="w-8 h-8 text-primary/80 mt-1" />
                            <div>
                                <CardTitle className="font-headline text-xl text-foreground">{lesson.name}</CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">{lesson.content.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
