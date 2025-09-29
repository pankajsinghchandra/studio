import { notFound } from 'next/navigation';
import { data } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Breadcrumb from '@/components/breadcrumb';

export async function generateStaticParams() {
  return data.map((classData) => ({
    classId: classData.id,
  }));
}

export default function ClassPage({ params }: { params: { classId: string } }) {
  const classData = data.find((c) => c.id === params.classId);

  if (!classData) {
    notFound();
  }

  const breadcrumbItems = [
    { href: '/', label: 'Home' },
    { href: `/${classData.id}`, label: classData.name },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          {classData.name}
        </h1>
        <p className="text-lg text-muted-foreground">Select a subject to explore.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classData.subjects.map((subject) => (
          <Link href={`/${classData.id}/${subject.id}`} key={subject.id} className="block transition-transform duration-300 hover:-translate-y-1">
                <Card className="bg-card hover:bg-accent/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 h-full">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <subject.icon className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle className="font-headline text-2xl text-foreground">{subject.name}</CardTitle>
                                <CardDescription>{subject.lessons.length} lessons available</CardDescription>
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
