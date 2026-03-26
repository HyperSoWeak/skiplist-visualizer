import React, { useMemo } from 'react';
import { SkipListState, NodeVisualState } from '../types/types';

interface SkipListGridProps {
  skipList: SkipListState;
  visualHeight: number;
  nodeStates: Record<string, NodeVisualState>;
  insertingValue: number | null;
  deletedNodes: Record<number, Set<string>>;
  activeLevels: Record<number, boolean>;
}

export function SkipListGrid({ skipList, visualHeight, nodeStates, deletedNodes, insertingValue, activeLevels }: SkipListGridProps) {
  
  const columns = useMemo(() => {
    const valSet = new Set(skipList.values);
    if (insertingValue !== null) valSet.add(insertingValue);
    return ['start', ...Array.from(valSet).sort((a, b) => a - b), 'end'];
  }, [skipList.values, insertingValue]);

  return (
    <div className="bg-white p-12 rounded-3xl border border-slate-200 overflow-x-auto shadow-sm transition-all duration-700">
      <div 
        className="grid gap-y-12 gap-x-0 items-center justify-items-center min-w-max"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr))` }}
      >
        {[...Array(visualHeight)].map((_, i) => visualHeight - 1 - i).map(lvl => (
          <React.Fragment key={`lvl-${lvl}`}>
            {columns.map((colValue, colIdx) => {
              const node = skipList.levels.find((l: any) => l.level === lvl)?.nodes.find((n: any) => 
                (colValue === 'start' && n.kind === 'start') ||
                (colValue === 'end' && n.kind === 'end') ||
                (n.numericValue === colValue)
              );

              const isStartEnd = colValue === 'start' || colValue === 'end';
              const isVirtualInsert = colValue === insertingValue && activeLevels[lvl];
              
              // 2. Logic: Hide the node if it's in the deletedNodes set
              const isDeleted = node && deletedNodes[lvl]?.has(node.id);
              
              const shouldShowNode = (node || isStartEnd || isVirtualInsert) && !isDeleted;
              const displayId = node?.id || `v-${colValue}-${lvl}`;

              return (
                <div key={`${lvl}-${colIdx}`} className="w-full flex items-center justify-center relative h-16">
                  {/* The continuous edge always exists in the background */}
                  <div className="absolute w-full h-0.5 bg-slate-200 z-0"></div>

                  <div className={`
                    w-14 h-14 flex items-center justify-center border-2 rounded-xl font-bold z-10 
                    transition-all duration-500 ease-in-out
                    ${shouldShowNode ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                    ${nodeStates[displayId] === 'visited' ? 'bg-blue-500 border-blue-600 text-white' : 
                      nodeStates[displayId] === 'next' ? 'bg-yellow-400 border-yellow-500' :
                      nodeStates[displayId] === 'found' ? 'bg-green-500 border-green-600 text-white' : 
                      'bg-white border-slate-300 text-slate-600'}
                  `}>
                    {colValue === 'start' ? '-∞' : colValue === 'end' ? '+∞' : colValue}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}