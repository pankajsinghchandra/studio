'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { 
    Bold, Italic, Strikethrough, List, ListOrdered, 
    Quote, Redo, Undo, Palette, Heading1, Heading2, Heading3,
    Indent as IndentIcon, Outdent
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from './ui/separator';

const colors = [
  '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#9ca3af',
  '#ffffff', '#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4', '#e5e7eb',
];

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation='vertical' className='h-6 mx-1' />

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().indent().run()} disabled={!editor.can().indent()}>
          <IndentIcon className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().outdent().run()} disabled={!editor.can().outdent()}>
          <Outdent className="h-4 w-4" />
      </Button>

      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <Separator orientation='vertical' className='h-6 mx-1' />

      <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" type="button">
                <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
             <div className="flex flex-col gap-2">
                <div className="grid grid-cols-9 gap-1">
                    {colors.map(color => (
                        <Button
                            key={color}
                            type="button"
                            variant={editor.isActive('textStyle', { color }) ? 'outline' : 'ghost'}
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => editor.chain().focus().setColor(color).run()}
                        >
                            <div style={{ backgroundColor: color }} className="h-4 w-4 rounded-full border" />
                        </Button>
                    ))}
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => editor.chain().focus().unsetColor().run()}
                >
                  Default Color
                </Button>
            </div>
          </PopoverContent>
      </Popover>

      <Separator orientation='vertical' className='h-6 mx-1' />

      <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
      </Button>
       <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
            keepMarks: true,
            keepAttributes: false, 
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm max-w-none focus:outline-none p-4 rounded-b-md border border-input min-h-[250px]',
        }
    }
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;