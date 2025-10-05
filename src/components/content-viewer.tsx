'use client';
import type { Content } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Video, Mic } from 'lucide-react';

const renderContent = (content: Content) => {
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
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      );
    case 'video':
      // Appending &rm=minimal hides the download and other buttons in the Google Drive embed.
      const videoSrc = content.source.includes('?') ? `${content.source}&rm=minimal` : `${content.source}?rm=minimal`;
       return (
        <div className="aspect-w-16 aspect-h-9 w-full">
          <iframe
            src={videoSrc}
            className="w-full h-[80vh] rounded-lg border-2 border-border"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
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

const getIcon = (type: Content['type']) => {
    switch (type) {
        case 'video':
            return <Video className="mr-2 h-4 w-4" />;
        case 'audio':
            return <Mic className="mr-2 h-4 w-4" />;
        case 'pdf':
        case 'doc':
        case 'text':
        default:
            return <FileText className="mr-2 h-4 w-4" />;
    }
}


export default function ContentViewer({ contents }: { contents: Content[] }) {
  if (contents.length === 1) {
    return renderContent(contents[0]);
  }

  return (
    <Tabs defaultValue={contents[0].id} className="w-full">
      <TabsList>
        {contents.map(content => (
          <TabsTrigger key={content.id} value={content.id}>
            {getIcon(content.type)}
            {content.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {contents.map(content => (
        <TabsContent key={content.id} value={content.id}>
          {renderContent(content)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
