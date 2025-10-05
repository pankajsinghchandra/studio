import { notFound } from 'next/navigation';
import { data } from '@/lib/data';
import Breadcrumb from '@/components/breadcrumb';
import ContentViewer from '@/components/content-viewer';

export async function generateStaticParams() {
    const paths = [];
    for (const classData of data) {
        for (const subject of classData.subjects) {
            for (const lesson of subject.lessons) {
                paths.push({ classId: classData.id, subjectId: subject.id, lessonId: lesson.id });
            }
        }
    }
    return paths;
}

export default function LessonPage({ params }: { params: { classId: string; subjectId: string; lessonId: string } }) {
  const classData = data.find((c) => c.id === params.classId);
  const subject = classData?.subjects.find((s) => s.id === params.subjectId);
  const lesson = subject?.lessons.find((l) => l.id === params.lessonId);

  if (!classData || !subject || !lesson) {
    notFound();
  }

  const breadcrumbItems = [
    { href: '/', label: 'Home' },
    { href: `/${classData.id}`, label: classData.name },
    { href: `/${classData.id}/${subject.id}`, label: subject.name },
    { href: `/${classData.id}/${subject.id}/${lesson.id}`, label: lesson.name },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          {lesson.name}
        </h1>
        <p className="text-lg text-muted-foreground">{lesson.content[0]?.description || 'Multiple content types available.'}</p>
      </header>
      <ContentViewer contents={lesson.content} />
    </div>
  );
}
