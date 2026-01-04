'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <div className={cn("flex", !isRoot && "items-stretch")}>
        {!isRoot && (
          <div className="w-12 shrink-0 relative">
            <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/30"></div>
            <div className="absolute left-1/2 top-1/2 h-px w-1/2 bg-muted-foreground/30"></div>
          </div>
        )}

        <div className={cn("flex flex-col items-start", isRoot ? "" : "py-2")}>
            <CollapsibleTrigger
            disabled={!hasChildren}
            className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-md w-auto z-10',
                isRoot
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground border',
                !hasChildren && 'cursor-default'
            )}
            >
            <span>{node.label}</span>
            {hasChildren && (
                <ChevronRight
                className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    isOpen && 'rotate-90'
                )}
                />
            )}
            </CollapsibleTrigger>
        </div>

        {hasChildren && (
          <CollapsibleContent asChild className="flex-1">
            <div className={cn("relative flex flex-col justify-center", isRoot ? 'pl-12' : '')}>
                <div className={cn("absolute left-0 top-1/2 h-px w-12 bg-muted-foreground/30", isRoot ? '' : 'hidden')}></div>
                {node.children?.map((child, index) => (
                    <Node key={index} node={child} />
                ))}
            </div>
          </CollapsibleContent>
        )}
      </div>
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
