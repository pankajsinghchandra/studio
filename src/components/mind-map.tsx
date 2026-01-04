'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

const colors = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#ec4899', // pink-500
];

const Node: React.FC<{ node: MindMapNode; isRoot?: boolean; level?: number }> = ({
  node,
  isRoot = false,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = React.useState(isRoot);
  const hasChildren = node.children && node.children.length > 0;
  const color = colors[level % colors.length];

  const parentRef = React.useRef<HTMLDivElement>(null);
  const childrenContainerRef = React.useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = React.useState(0);
  const [svgPath, setSvgPath] = React.useState('');

  React.useEffect(() => {
    if (isOpen && hasChildren && parentRef.current && childrenContainerRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const containerRect = childrenContainerRef.current.getBoundingClientRect();

      const startY = parentRect.height / 2;
      const endY = containerRect.height;
      
      setSvgHeight(endY);

      if (containerRect.height > 0) {
        // Path from parent to the vertical line
        let path = `M0,${startY} L24,${startY} `;

        const firstChild = childrenContainerRef.current.firstElementChild as HTMLElement;
        const lastChild = childrenContainerRef.current.lastElementChild as HTMLElement;

        if (firstChild && lastChild) {
            const firstChildRect = firstChild.getBoundingClientRect();
            const lastChildRect = lastChild.getBoundingClientRect();

            const firstChildY = (firstChildRect.top - containerRect.top) + (firstChildRect.height / 2);
            const lastChildY = (lastChildRect.top - containerRect.top) + (lastChildRect.height / 2);
            
            // Vertical Bracket Line
            path += `M48,${firstChildY} C32,${firstChildY} 32,${(firstChildY + lastChildY) / 2} 48,${(firstChildY + lastChildY) / 2} C64,${(firstChildY + lastChildY) / 2} 64,${lastChildY} 48,${lastChildY} `;

            // Horizontal lines to children
             Array.from(childrenContainerRef.current.children).forEach(child => {
                const childEl = child as HTMLElement;
                const childRect = childEl.getBoundingClientRect();
                const childY = (childRect.top - containerRect.top) + (childRect.height / 2);
                path += `M48,${childY} L72,${childY} `;
            });
        }
         setSvgPath(path);
      }
    }
  }, [isOpen, hasChildren, node.children]);
  

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative pl-8">
      <div className="flex items-center">
        {/* Node itself */}
        <div ref={parentRef} className="relative z-10">
          <CollapsibleTrigger
            disabled={!hasChildren}
            className={cn(
              'flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-md',
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

        {/* Children and connecting lines */}
        {hasChildren && (
          <div className="relative ml-6">
            <div
              ref={childrenContainerRef}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              <svg
                  height={svgHeight}
                  width={72}
                  className={cn(
                    'absolute left-0 top-0 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ overflow: 'visible' }}
                >
                  <path
                    d={svgPath}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

              <CollapsibleContent forceMount asChild className="flex-1">
                <div
                  className={cn(
                    'flex flex-col justify-center gap-2 pl-24 transition-all duration-300',
                    !isOpen && 'hidden'
                  )}
                >
                  {node.children?.map((child, index) => (
                    <Node key={index} node={child} level={level + 1} />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </div>
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
