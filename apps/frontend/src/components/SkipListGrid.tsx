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

export function SkipListGrid({
  skipList,
  visualHeight,
  nodeStates,
  deletedNodes,
  insertingValue,
  activeLevels,
}: SkipListGridProps) {
  const columns = useMemo(() => {
    const valSet = new Set(skipList.values);
    if (insertingValue !== null) valSet.add(insertingValue);
    return ['start', ...Array.from(valSet).sort((a, b) => a - b), 'end'];
  }, [skipList.values, insertingValue]);

  const checkNodeExistence = (lvl: number, colValue: string | number) => {
    if (lvl < 0 || lvl >= visualHeight) return false;

    const isStartEnd = colValue === 'start' || colValue === 'end';
    const isVirtual = colValue === insertingValue && activeLevels[lvl];
    const realNode = skipList.levels
      .find((l) => l.level === lvl)
      ?.nodes.find(
        (n) =>
          (colValue === 'start' && n.kind === 'start') ||
          (colValue === 'end' && n.kind === 'end') ||
          n.numericValue === colValue,
      );
    const isDeleted = realNode && deletedNodes[lvl]?.has(realNode.id);

    return (realNode || isStartEnd || isVirtual) && !isDeleted;
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-12 shadow-sm transition-all duration-700">
      <div
        className="grid min-w-max items-center justify-items-center gap-x-0 gap-y-12"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr))`,
        }}
      >
        {[...Array(visualHeight)]
          .map((_, i) => visualHeight - 1 - i)
          .map((lvl) => (
            <React.Fragment key={`lvl-${lvl}`}>
              {columns.map((colValue, colIdx) => {
                const node = skipList.levels
                  .find((l: any) => l.level === lvl)
                  ?.nodes.find(
                    (n: any) =>
                      (colValue === 'start' && n.kind === 'start') ||
                      (colValue === 'end' && n.kind === 'end') ||
                      n.numericValue === colValue,
                  );

                const isStartEnd = colValue === 'start' || colValue === 'end';
                const isVirtualInsert =
                  colValue === insertingValue && activeLevels[lvl];

                const isDeleted = node && deletedNodes[lvl]?.has(node.id);

                const shouldShowNode =
                  (node || isStartEnd || isVirtualInsert) && !isDeleted;
                const shouldShowVerticalEdge =
                  lvl > 0 &&
                  shouldShowNode &&
                  checkNodeExistence(lvl - 1, colValue);
                const displayId = node?.id || `v-${colValue}-${lvl}`;

                return (
                  <div
                    key={`${lvl}-${colIdx}`}
                    className="relative flex h-16 w-full items-center justify-center"
                  >
                    <div className="absolute z-0 h-0.5 w-full bg-slate-200"></div>

                    {shouldShowVerticalEdge && (
                      <div className="absolute z-0 h-12 w-1 translate-y-14 bg-slate-200 transition-all duration-500"></div>
                    )}

                    <div
                      className={`z-10 flex h-14 w-14 items-center justify-center rounded-xl border-2 font-bold transition-all duration-500 ease-in-out ${shouldShowNode ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${
                        nodeStates[displayId] === 'visited'
                          ? 'border-blue-600 bg-blue-500 text-white'
                          : nodeStates[displayId] === 'next'
                            ? 'border-yellow-500 bg-yellow-400'
                            : nodeStates[displayId] === 'found'
                              ? 'border-green-600 bg-green-500 text-white'
                              : 'border-slate-300 bg-white text-slate-600'
                      } `}
                    >
                      {colValue === 'start'
                        ? 'Head'
                        : colValue === 'end'
                          ? 'NIL'
                          : colValue}
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
