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
  const [svgPaths, setSvgPaths] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen && hasChildren && parentRef.current && childrenContainerRef.current) {
        const calculatePath = () => {
            if (!parentRef.current || !childrenContainerRef.current) return;

            const parentRect = parentRef.current.getBoundingClientRect();
            const containerRect = childrenContainerRef.current.getBoundingClientRect();
            
            if (containerRect.height === 0) {
                requestAnimationFrame(calculatePath);
                return;
            }
            
            const startY = parentRect.height / 2;
            const childrenElements = Array.from(childrenContainerRef.current.children);
            const paths: string[] = [];

            if (childrenElements.length === 0) return;

            const branchStartX = 24;
            const horizontalLine = `M 0 ${startY} H ${branchStartX}`;
            paths.push(horizontalLine);
            
            childrenElements.forEach(child => {
                const childEl = child as HTMLElement;
                const childRect = childEl.getBoundingClientRect();
                const childY = (childRect.top - containerRect.top) + (childRect.height / 2);

                const controlPointX1 = branchStartX + 20;
                const controlPointY1 = startY;
                const controlPointX2 = branchStartX + 20;
                const controlPointY2 = childY;
                
                paths.push(`M ${branchStartX} ${startY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, 72 ${childY}`);
            });
            
            setSvgHeight(containerRect.height);
            setSvgPaths(paths);
        };
        
        requestAnimationFrame(calculatePath);
        
        const resizeObserver = new ResizeObserver(calculatePath);
        resizeObserver.observe(childrenContainerRef.current);

        return () => resizeObserver.disconnect();
    }
  }, [isOpen, hasChildren, node.children]);
  

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative flex items-start">
        <div ref={parentRef} className="relative z-10 flex items-center" style={{marginTop: hasChildren && isOpen ? `calc(${svgHeight/2}px - 20px)` : '0px'}}>
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

        {hasChildren && (
            <div className="relative ml-6 flex items-center">
                <svg
                    height={svgHeight}
                    width={72}
                    className={cn(
                        'transition-opacity duration-300 absolute',
                        isOpen ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ overflow: 'visible' }}
                    >
                    {svgPaths.map((path, index) => (
                         <path
                            key={index}
                            d={path}
                            stroke={color}
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    ))}
                </svg>

                <CollapsibleContent forceMount asChild>
                    <div
                    ref={childrenContainerRef}
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
