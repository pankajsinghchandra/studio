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
    case 'video':
        return (
            <div className="aspect-w-16 aspect-h-9 w-full">
                <video controls autoPlay loop className="w-full rounded-lg border-2 border-border">
                    <source src={content.source} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    case 'audio':
        return (
            <Card>
                <CardContent className="p-6">
                    <audio controls className="w-full">
                        <source src={content.source} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </CardContent>
            </Card>
        );
    default:
      return <p>Unsupported content type.</p>;
  }
}
