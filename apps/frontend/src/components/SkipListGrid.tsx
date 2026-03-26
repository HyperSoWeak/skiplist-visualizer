import React, { useMemo } from 'react';
import { SkipListState, NodeVisualState } from '../types/types';

interface SkipListGridProps {
  skipList: SkipListState;
  nodeStates: Record<string, NodeVisualState>;
  insertingValue: number | null;
  activeLevels: Record<number, boolean>;
}

export function SkipListGrid({ skipList, nodeStates, insertingValue, activeLevels }: SkipListGridProps) {
  
  // FIX: Correctly sort the virtual node into the column list
  const columns = useMemo(() => {
    const vals = [...skipList.values];
    if (insertingValue !== null && !vals.includes(insertingValue)) {
      vals.push(insertingValue);
    }
    const sortedVals = vals.sort((a, b) => a - b);
    console.log(sortedVals, activeLevels, insertingValue);
    return ['start', ...sortedVals, 'end'];
  }, [skipList.values, insertingValue]);

  const getNodeStyles = (nodeId: string) => {
    const state = nodeStates[nodeId];
    switch(state) {
      case 'visited': return 'bg-blue-500 border-blue-600 text-white scale-110 shadow-md';
      case 'next':    return 'bg-yellow-400 border-yellow-600 text-slate-900 scale-105 animate-pulse'; // Restore Inspecting
      case 'found':   return 'bg-green-500 border-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]';
      default:        return 'bg-white border-slate-300 text-slate-600';
    }
  };

  return (
    <div className="bg-slate-100 p-10 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
      <div 
        className="grid gap-y-10 gap-x-0 items-center justify-items-center min-w-max"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr))` }}
      >
        {[...Array(skipList.height)].map((_, i) => skipList.height - 1 - i).map(lvl => (
          <React.Fragment key={`lvl-${lvl}`}>
            {columns.map((colValue, colIdx) => {
              const node = skipList.levels.find(l => l.level === lvl)?.nodes.find(n => 
                (colValue === 'start' && n.kind === 'start') ||
                (colValue === 'end' && n.kind === 'end') ||
                (n.numericValue === colValue)
              );

              const isVirtualColumn = colValue === insertingValue;
              const shouldShowNode = node || (isVirtualColumn && activeLevels[lvl]);
              
              // Fallback ID for nodes that aren't in the official state yet so we can color them
              const displayId = node?.id || (isVirtualColumn ? `n${colValue}-${lvl}` : `edge-${lvl}-${colIdx}`);

              return (
                <div key={`${lvl}-${colIdx}`} className="w-full flex items-center justify-center relative h-16">
                  {/* The Horizontal Arrow (Background Layer) */}
                  <div className="absolute w-full h-0.5 bg-slate-300 z-0"></div>

                  {shouldShowNode ? (
                    <div className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl font-bold z-10 transition-all duration-500 ${getNodeStyles(displayId)}`}>
                      {colValue === 'start' ? 'Start' : colValue === 'end' ? 'NIL' : colValue}
                    </div>
                  ) : (
                    /* This is the "Gap" or "Edge" that expands when space is made */
                    <div className="z-10 w-14 h-14 flex items-center justify-center opacity-0 pointer-events-none">
                      {/* Placeholder to keep grid spacing consistent */}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}