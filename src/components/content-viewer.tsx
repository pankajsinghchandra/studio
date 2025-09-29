'use client';
import type { Content } from '@/lib/types';
import { Card, CardContent } from './ui/card';

export default function ContentViewer({ content }: { content: Content }) {
  switch (content.type) {
    case 'text':
      return (
        <Card>
          <CardContent className="prose prose-invert max-w-none p-6 text-foreground">
            <div dangerouslySetInnerHTML={{ __html: content.source.replace(/\n/g, '<br />') }} />
          </CardContent>
        </Card>
      );
    case 'pdf':
    case 'video':
    case 'audio':
    case 'doc':
      return (
        <div className="aspect-w-16 aspect-h-9 w-full">
          <iframe
            src={content.source}
            className="w-full h-[80vh] rounded-lg border-2 border-border"
            allow="autoplay"
          ></iframe>
        </div>
      );
    default:
      return <p>Unsupported content type.</p>;
  }
}
