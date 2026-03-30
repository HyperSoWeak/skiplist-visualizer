import React, { useEffect, useState } from 'react';
import {
  SkipListState,
  NodeVisualState,
  OperationResult,
} from '../types/types';
import { SkipListGrid } from './SkipListGrid';

const API_BASE = 'http://localhost:3000';

export default function SkipListVisualizer() {
  const [skipList, setSkipList] = useState<SkipListState | null>(null);
  const [visualHeight, setVisualHeight] = useState(0);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeVisualState>>(
    {},
  );
  const [insertingValue, setInsertingValue] = useState<number | null>(null);
  const [deletedNodes, setDeletedNodes] = useState<Record<number, Set<string>>>(
    {},
  );
  const [activeLevels, setActiveLevels] = useState<Record<number, boolean>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('Ready');

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'find' | 'insert' | 'delete' | 'reset';
    inputValue: string;
  }>({ isOpen: false, type: 'find', inputValue: '' });

  const playAnimation = async (result: OperationResult) => {
    setIsAnimating(true);
    setNodeStates({});
    setInsertingValue(null);
    setDeletedNodes({});
    setActiveLevels({});
    setVisualHeight(skipList?.height || 0);

    for (const step of result.steps) {
      setCurrentMessage(step.message);

      if (step.structureChange?.type === 'add_level') {
        setVisualHeight((prev) => prev + 1);
      } else if (step.structureChange?.type === 'insert_node') {
        setInsertingValue(result.targetValue);
        setActiveLevels((prev) => ({
          ...prev,
          [step.structureChange?.level ?? 0]: true,
        }));
      } else if (step.structureChange?.type === 'delete_node') {
        setDeletedNodes((prev) => ({
          ...prev,
          [step.structureChange?.level ?? 0]: new Set([
            ...(prev[step.structureChange?.level ?? 0] || []),
            step.structureChange?.nodeId ?? '',
          ]),
        }));
      } else if (step.structureChange?.type === 'remove_level') {
        setVisualHeight((prev) => Math.max(1, prev - 1));
      }

      if (step.stateChanges) {
        setNodeStates((prev) => {
          const next = { ...prev };
          step.stateChanges.forEach((sc) => {
            next[sc.nodeId] = sc.state;
          });
          return next;
        });
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    if (result.finalState) {
      setSkipList(result.finalState);
      setVisualHeight(result.finalState.height);
    }

    await new Promise((r) => setTimeout(r, 1000));

    setNodeStates({});
    setActiveLevels({});
    setInsertingValue(null);
    setDeletedNodes({});
    setIsAnimating(false);
  };
  const handleActionSubmit = () => {
    const val = parseInt(modalConfig.inputValue);
    if (isNaN(val)) return;
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    if (modalConfig.type === 'find') {
      async function fetchFind() {
        const res = await fetch(`${API_BASE}/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val }),
        });
        const data: OperationResult = await res.json();
        await playAnimation(data);
        if (data.success) {
          setCurrentMessage(`Value ${val} found in skip-list!`);
        } else {
          setCurrentMessage(`Value ${val} not found in skip-list.`);
        }
      }
      fetchFind();
    } else if (modalConfig.type === 'insert') {
      async function fetchInsert() {
        const res = await fetch(`${API_BASE}/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val }),
        });
        const data: OperationResult = await res.json();
        await playAnimation(data);
        if (data.success) {
          setCurrentMessage(`Value ${val} inserted successfully!`);
        } else {
          setCurrentMessage(
            `${val} already exists in skip-list. Failed to insert.`,
          );
        }
      }
      fetchInsert();
    } else if (modalConfig.type === 'delete') {
      async function fetchDelete() {
        const res = await fetch(`${API_BASE}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val }),
        });
        const data: OperationResult = await res.json();
        await playAnimation(data);
        if (data.success) {
          setCurrentMessage(`Value ${val} deleted successfully!`);
        } else {
          setCurrentMessage(`${val} not found in skip-list. Failed to delete.`);
        }
      }
      fetchDelete();
    }
  };

  const handleReset = () => {
    async function fetchReset() {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
      });
      const data: OperationResult = await res.json();
      await playAnimation(data);
      setCurrentMessage('Skip-list has been reset.');
    }
    fetchReset();
  };

  useEffect(() => {
    async function fetchInitialState() {
      const res = await fetch(`${API_BASE}/state`);
      const data = await res.json();
      setSkipList(data);
      setVisualHeight(data.height);
    }
    fetchInitialState();
  }, []);

  if (!skipList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-600">Loading skip-list state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">Skip-List Visualizer</h1>
          <div className="flex items-center gap-3">
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${isAnimating ? 'animate-pulse bg-blue-500' : 'bg-slate-300'}`}
            ></span>
            <p className="font-mono text-lg text-slate-600">{currentMessage}</p>
          </div>
        </div>

        <SkipListGrid
          skipList={skipList}
          nodeStates={nodeStates}
          insertingValue={insertingValue}
          activeLevels={activeLevels}
          deletedNodes={deletedNodes}
          visualHeight={visualHeight}
        />

        <div className="flex gap-4">
          {['find', 'insert', 'delete'].map((action) => (
            <button
              key={action}
              disabled={isAnimating}
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  type: action as any,
                  inputValue: '',
                })
              }
              className="flex-1 cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold text-white capitalize transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {action}
            </button>
          ))}
          <button
            disabled={isAnimating}
            onClick={() => handleReset()}
            className="flex-1 cursor-pointer rounded-lg bg-slate-600 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold capitalize">
              {modalConfig.type} Node
            </h2>
            <input
              type="number"
              autoFocus
              step="1"
              className="mb-4 w-full rounded-lg border-2 border-slate-200 p-3 text-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter an integer..."
              value={modalConfig.inputValue}
              onChange={(e) =>
                setModalConfig((prev) => ({
                  ...prev,
                  inputValue: e.target.value,
                }))
              }
              onKeyDown={(e) => e.key === 'Enter' && handleActionSubmit()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setModalConfig((prev) => ({ ...prev, isOpen: false }))
                }
                className="cursor-pointer rounded-lg px-4 py-2 text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white capitalize hover:bg-blue-700"
              >
                {modalConfig.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
