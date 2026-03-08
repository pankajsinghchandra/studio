'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, PlusSquare, MinusSquare, ZoomIn, ZoomOut } from 'lucide-react';
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
    scale: number;
}

const Node: React.FC<NodeProps> = ({
  node,
  isRoot = false,
  level = 0,
  allOpen,
  scale,
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

  React.useLayoutEffect(() => {
    if (!isOpen || !hasChildren || !parentRef.current || !childrenContainerRef.current) {
        return;
    }

    const calculatePath = () => {
        if (!parentRef.current || !childrenContainerRef.current) return;
        
        const svgWrapper = childrenContainerRef.current.parentElement?.parentElement;
        if (!svgWrapper) return;
        
        const wrapperRect = svgWrapper.getBoundingClientRect();
        const parentTriggerRect = parentRef.current.getBoundingClientRect();

        const childrenElements = Array.from(childrenContainerRef.current.children) as HTMLElement[];
        
        const childTriggerRects = childrenElements
            .map(child => child.children[0] as HTMLElement)
            .filter(Boolean)
            .map(triggerWrapper => triggerWrapper.getBoundingClientRect());

        if (childTriggerRects.length === 0 || childTriggerRects.some(r => r.height === 0)) {
            setSvgPaths([]);
            return;
        };

        const parentCenterY = (parentTriggerRect.top - wrapperRect.top) + (parentTriggerRect.height / 2);

        const childCenterYs = childTriggerRects.map(r => (r.top - wrapperRect.top) + (r.height / 2));
        
        const firstChildCenterY = childCenterYs[0];
        const lastChildCenterY = childCenterYs[childCenterYs.length - 1];

        const svgTop = Math.min(parentCenterY, firstChildCenterY);
        const svgBottom = Math.max(parentCenterY, lastChildCenterY);
        const svgHeight = Math.max(1, svgBottom - svgTop);

        const svgWidth = 60;
        const startX = 0;
        const endX = svgWidth;
        const smoothness = svgWidth * 0.6;

        const newPaths: string[] = [];
        childCenterYs.forEach(childCenterY => {
            const startPointY = parentCenterY - svgTop;
            const endPointY = childCenterY - svgTop;
            
            const d = `M ${startX},${startPointY} C ${startX + smoothness},${startPointY} ${endX - smoothness},${endPointY} ${endX},${endPointY}`;
            newPaths.push(d);
        });
        
        setSvgDimensions({ height: svgHeight, width: svgWidth, top: svgTop });
        setSvgPaths(newPaths);
    };
    
    const animationFrameId = requestAnimationFrame(calculatePath);
    
    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(calculatePath);
    });
    
    resizeObserver.observe(parentRef.current);
    const childrenToObserve = Array.from(childrenContainerRef.current.children) as HTMLElement[];
    childrenToObserve.forEach(child => {
        if (child.children[0]) {
            resizeObserver.observe(child.children[0]);
        }
    });
    if (childrenContainerRef.current.parentElement) {
        resizeObserver.observe(childrenContainerRef.current.parentElement);
    }


    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isOpen, hasChildren, node.children, allOpen, scale]);
  

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative flex items-center">
        <div ref={parentRef} className="relative z-10 flex items-center">
            <CollapsibleTrigger
                disabled={!hasChildren}
                className={cn(
                'flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-md whitespace-nowrap',
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
                        'flex flex-col gap-4 pl-24 transition-all duration-300 items-start',
                        !isOpen && 'hidden'
                    )}
                    >
                    {node.children?.map((child, index) => (
                        <Node key={index} node={child} level={level + 1} allOpen={allOpen} scale={scale}/>
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
  const [scale, setScale] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);


  const handleExpandAll = () => {
    setAllOpen(true);
    setIsAllOpen(true);
  };

  const handleCollapseAll = () => {
    setAllOpen(false);
    setIsAllOpen(false);
  };
  
  const handleZoomIn = () => setScale(s => Math.min(2.5, s * 1.2));
  const handleZoomOut = () => setScale(s => Math.max(0.3, s / 1.2));
  const handleZoomReset = () => setScale(1);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        if (event.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    el.addEventListener('wheel', handleWheel);
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto pb-8" title="Use Ctrl + Scroll to zoom">
        <div 
          className="relative p-8 inline-block align-top min-w-full transition-transform duration-200"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
            <Node node={data} isRoot allOpen={allOpen} scale={scale} />
        </div>
        <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="flex items-center bg-background rounded-lg shadow-lg border p-1">
                <Button onClick={handleZoomOut} variant="ghost" size="sm" className="shadow-none">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={handleZoomReset} variant="ghost" size="sm" className="shadow-none text-muted-foreground w-14 tabular-nums">
                    {`${Math.round(scale * 100)}%`}
                </Button>
                <Button onClick={handleZoomIn} variant="ghost" size="sm" className="shadow-none">
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>
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
