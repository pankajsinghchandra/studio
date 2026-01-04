'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronsUpDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

interface NodeProps {
  node: MindMapNode;
  isRoot?: boolean;
}

const Node: React.FC<NodeProps> = ({ node, isRoot = false }) => {
  const [isOpen, setIsOpen] = React.useState(isRoot);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative pl-8 group">
      {!isRoot && (
        <div className="absolute left-0 top-[18px] h-full w-px bg-muted-foreground/30"></div>
      )}
       {!isRoot && (
        <div className="absolute left-0 top-[18px] w-8 h-px bg-muted-foreground/30"></div>
      )}

      <div className="relative flex items-center gap-2">
        <CollapsibleTrigger asChild>
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 absolute -left-12 top-1/2 -translate-y-1/2 rounded-full bg-background border border-border"
            >
              {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">Toggle</span>
            </Button>
          ) : (
             <div className="absolute -left-12 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-border" />
          )}
        </CollapsibleTrigger>
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium shadow-md',
            isRoot
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground border'
          )}
        >
          {node.label}
        </div>
      </div>

      {hasChildren && (
        <CollapsibleContent asChild>
          <div className="relative pt-4 space-y-4">
            {node.children?.map((child, index) => (
              <Node key={index} node={child} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};


interface MindMapProps {
    data: MindMapNode;
}

const MindMap: React.FC<MindMapProps> = ({ data }) => {
  return (
    <div className="p-8 w-full h-full overflow-auto">
        <Node node={data} isRoot />
    </div>
  );
};

export default MindMap;
