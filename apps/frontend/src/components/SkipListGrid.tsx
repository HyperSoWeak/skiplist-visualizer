import React, { useMemo } from 'react';
import { SkipListState, NodeVisualState } from '../types/types';

interface SkipListGridProps {
  skipList: SkipListState;
  nodeStates: Record<string, NodeVisualState>;
}

export function SkipListGrid({ skipList, nodeStates }: SkipListGridProps) {
  // Determine columns needed based on all values
  const columns = useMemo(() => {
    return ['start', ...[...skipList.values].sort((a, b) => a - b), 'end'];
  }, [skipList.values]);

  const getNodeColor = (state?: NodeVisualState) => {
    switch(state) {
      case 'visited': return 'bg-blue-200 border-blue-500';
      case 'next': return 'bg-yellow-200 border-yellow-500';
      case 'found': return 'bg-green-300 border-green-600 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      default: return 'bg-white border-slate-300';
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <div 
        className="grid gap-y-6 gap-x-4 items-center justify-items-center"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(60px, 1fr))` }}
      >
        {/* Render top-down based on height */}
        {[...skipList.levels].sort((a,b) => b.level - a.level).map(levelObj => (
          <React.Fragment key={`level-${levelObj.level}`}>
            {columns.map((colValue, colIndex) => {
              const nodeInThisCell = levelObj.nodes.find(n => 
                (colValue === 'start' && n.kind === 'start') ||
                (colValue === 'end' && n.kind === 'end') ||
                (n.numericValue === colValue)
              );

              return (
                <div key={`${levelObj.level}-${colIndex}`} className="w-full flex items-center justify-center relative h-12">
                  {nodeInThisCell ? (
                    <div className={`w-14 h-14 flex items-center justify-center border-2 rounded-lg font-bold transition-all duration-300 ${getNodeColor(nodeStates[nodeInThisCell.id])}`}>
                      {nodeInThisCell.label}
                    </div>
                  ) : (
                    <div className="w-full h-1 bg-slate-300 z-0"></div>
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