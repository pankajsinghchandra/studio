'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, PlusSquare, MinusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

interface NodeProps {
    node: MindMapNode;
    isRoot?: boolean;
    level?: number;
    allOpen: boolean | null;
}

const Node: React.FC<NodeProps> = ({
  node,
  isRoot = false,
  level = 0,
  allOpen,
}) => {
  const [isOpen, setIsOpen] = React.useState(isRoot);
  const hasChildren = node.children && node.children.length > 0;
  const color = colors[level % colors.length];

  const parentRef = React.useRef<HTMLDivElement>(null);
  const childrenContainerRef = React.useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = React.useState({ height: 0, width: 0, top: 0 });
  const [svgPaths, setSvgPaths] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    if (allOpen !== null) {
      if (hasChildren) {
        setIsOpen(allOpen);
      }
    }
  }, [allOpen, hasChildren]);

  React.useEffect(() => {
    if (isOpen && hasChildren && parentRef.current && childrenContainerRef.current) {
        const calculatePath = () => {
            if (!parentRef.current || !childrenContainerRef.current) return;

            const parentRect = parentRef.current.getBoundingClientRect();
            const containerRect = childrenContainerRef.current.getBoundingClientRect();
            
            if (containerRect.height === 0 || parentRect.height === 0) {
                requestAnimationFrame(calculatePath);
                return;
            }

            const childrenElements = Array.from(childrenContainerRef.current.children) as HTMLElement[];
            if (childrenElements.length === 0) return;

            const svgWidth = 80;
            const startX = 0;
            
            const firstChildRect = childrenElements[0].getBoundingClientRect();
            const lastChildRect = childrenElements[childrenElements.length - 1].getBoundingClientRect();
            
            const startY = parentRect.top - containerRect.top + (parentRect.height / 2);
            
            const svgTop = Math.min(startY, firstChildRect.top - containerRect.top);
            const svgHeight = Math.max(startY, lastChildRect.bottom - containerRect.top) - svgTop;

            const paths: string[] = [];
            const endX = svgWidth / 2;

            childrenElements.forEach(child => {
                const childRect = child.getBoundingClientRect();
                const childY = (childRect.top - containerRect.top) + (childRect.height / 2) - svgTop;
                
                const controlX1 = startX + (endX - startX) * 0.5;
                const controlY1 = startY - svgTop;
                const controlX2 = startX + (endX - startX) * 0.5;
                const controlY2 = childY;
                
                paths.push(`M ${startX},${startY - svgTop} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${childY} L ${svgWidth},${childY}`);
            });
            
            setSvgDimensions({ height: svgHeight, width: svgWidth, top: svgTop });
            setSvgPaths(paths);
        };
        
        const timeoutId = setTimeout(calculatePath, 50);
        
        const resizeObserver = new ResizeObserver(calculatePath);
        if (childrenContainerRef.current) {
          resizeObserver.observe(childrenContainerRef.current);
        }
        if (parentRef.current) {
          resizeObserver.observe(parentRef.current);
        }

        return () => {
          clearTimeout(timeoutId);
          resizeObserver.disconnect();
        };
    }
  }, [isOpen, hasChildren, node.children]);
  

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative flex items-start">
        <div ref={parentRef} className="relative z-10 flex items-center">
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
                    height={svgDimensions.height}
                    width={svgDimensions.width}
                    className={cn(
                        'transition-opacity duration-300 absolute left-0',
                        isOpen ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ top: `${svgDimensions.top}px`, overflow: 'visible' }}
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
                        'flex flex-col gap-2 pl-24 transition-all duration-300',
                        !isOpen && 'hidden'
                    )}
                    >
                    {node.children?.map((child, index) => (
                        <Node key={index} node={child} level={level + 1} allOpen={allOpen} />
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
  const [allOpen, setAllOpen] = React.useState<boolean | null>(null);
  const [isAllOpen, setIsAllOpen] = React.useState(false);

  const toggleAll = () => {
    setAllOpen(!isAllOpen);
    setIsAllOpen(!isAllOpen);
  };
  
  const handleExpandAll = () => {
    setAllOpen(true);
    setIsAllOpen(true);
  };

  const handleCollapseAll = () => {
    setAllOpen(false);
    setIsAllOpen(false);
  };

  return (
    <div className="w-full h-full overflow-auto pb-8">
        <div className="p-8 inline-block min-w-full">
            <Node node={data} isRoot allOpen={allOpen} />
        </div>
        <div className="fixed bottom-4 right-4 z-20 flex gap-2">
            {isAllOpen ? (
                <Button onClick={handleCollapseAll} variant="default" size="sm" className="shadow-lg">
                    <MinusSquare className="h-4 w-4 mr-2" />
                    Collapse All
                </Button>
            ) : (
                <Button onClick={handleExpandAll} variant="default" size="sm" className="shadow-lg">
                    <PlusSquare className="h-4 w-4 mr-2" />
                    Expand All
                </Button>
            )}
        </div>
    </div>
  );
};

export default MindMap;
