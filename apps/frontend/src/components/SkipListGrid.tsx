import React, { useMemo } from 'react';
import { SkipListState, NodeVisualState } from '../types/types';

interface SkipListGridProps {
  skipList: SkipListState;
  visualHeight: number;
  nodeStates: Record<string, NodeVisualState>;
  insertingValue: number | null;
  activeLevels: Record<number, boolean>;
}

export function SkipListGrid({ skipList, visualHeight, nodeStates, insertingValue, activeLevels }: SkipListGridProps) {
  
  const columns = useMemo(() => {
    const valSet = new Set(skipList.values);
    if (insertingValue !== null) valSet.add(insertingValue);
    const sorted = Array.from(valSet).sort((a, b) => a - b);
    return ['start', ...sorted, 'end'];
  }, [skipList.values, insertingValue]);

  const getNodeStyles = (nodeId: string) => {
    const state = nodeStates[nodeId];
    switch(state) {
      case 'visited': return 'bg-blue-500 border-blue-600 text-white scale-110';
      case 'next':    return 'bg-yellow-400 border-yellow-600 animate-pulse';
      case 'found':   return 'bg-green-500 border-green-700 text-white shadow-lg';
      default:        return 'bg-white border-slate-300 text-slate-600';
    }
  };

  return (
    <div className="bg-slate-50 p-12 rounded-3xl border border-slate-200 overflow-x-auto shadow-inner transition-all duration-500">
      <div 
        className="grid gap-y-12 gap-x-0 items-center justify-items-center min-w-max"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr))` }}
      >
        {/* Iterate through visualHeight (top to bottom) */}
        {[...Array(visualHeight)].map((_, i) => visualHeight - 1 - i).map(lvl => (
          <React.Fragment key={`lvl-${lvl}`}>
            {columns.map((colValue, colIdx) => {
              // Check if node exists in real state or is currently being promoted
              const realLevel = skipList.levels.find(l => l.level === lvl);
              const node = realLevel?.nodes.find(n => 
                (colValue === 'start' && n.kind === 'start') ||
                (colValue === 'end' && n.kind === 'end') ||
                (n.numericValue === colValue)
              );

              // 1. New levels always have start and end nodes
              const isStartNode = colValue === 'start';
              const isEndNode = colValue === 'end';
              
              // 2. Determine if we show a node here
              const isVirtualNode = colValue === insertingValue && activeLevels[lvl];
              const shouldShowNode = node || isStartNode || isEndNode || isVirtualNode;
              
              const displayId = node?.id || (isVirtualNode ? `n${colValue}-${lvl}` : `base-${lvl}-${colValue}`);

              return (
                <div key={`${lvl}-${colIdx}`} className="w-full flex items-center justify-center relative h-16">
                  {/* The continuous arrow line */}
                  <div className="absolute w-full h-0.5 bg-slate-200 z-0"></div>

                  <div className={`
                    w-14 h-14 flex items-center justify-center border-2 rounded-xl font-bold z-10 
                    transition-all duration-500 ease-out
                    ${shouldShowNode ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                    ${getNodeStyles(displayId)}
                  `}>
                    {colValue === 'start' ? 'Start' : colValue === 'end' ? 'NIL' : colValue}
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