import React, { useEffect, useState } from 'react';
import { SkipListState, NodeVisualState, OperationResult } from '../types/types';
import { MOCK_INITIAL_STATE, MOCK_FIND_SUCCESS, MOCK_INSERT_SUCCESS, MOCK_DELETE_SUCCESS, MOCK_RESET } from '../data/data';
import { SkipListGrid } from './SkipListGrid';

const API_BASE = 'http://localhost:3000';

export default function SkipListVisualizer() {
  const [skipList, setSkipList] = useState<SkipListState>(MOCK_INITIAL_STATE);
  const [visualHeight, setVisualHeight] = useState(MOCK_INITIAL_STATE.height);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeVisualState>>({});
  const [insertingValue, setInsertingValue] = useState<number | null>(null);
  const [deletedNodes, setDeletedNodes] = useState<Record<number, Set<string>>>({});
  const [activeLevels, setActiveLevels] = useState<Record<number, boolean>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('Ready');
  
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, type: 'find' | 'insert' | 'delete' | 'reset', inputValue: string }>({ isOpen: false, type: 'find', inputValue: '' });

  // Playback Engine processes steps from OperationRecorder
  const playAnimation = async (result: OperationResult) => {
    setIsAnimating(true);
    setNodeStates({});
    setInsertingValue(null);
    setDeletedNodes({});
    setActiveLevels({});
    setVisualHeight(skipList.height);

    for (const step of result.steps) {
      setCurrentMessage(step.message);

      // Handle structural intermediate steps
      if (step.structureChange?.type === 'add_level') {
          // Increase height dynamically
          setVisualHeight(prev => prev + 1);
      } else if (step.structureChange?.type === 'insert_node') {
        setInsertingValue(result.targetValue);
        setActiveLevels(prev => ({ ...prev, [step.structureChange!.level!]: true }));
      } else if (step.structureChange?.type === 'delete_node') {
        setDeletedNodes(prev => ({
          ...prev,
          [step.structureChange!.level!]: new Set([...(prev[step.structureChange!.level!] || []), step.structureChange!.nodeId!])
        }));
      } else if (step.structureChange?.type === 'remove_level') {
        setVisualHeight(prev => Math.max(1, prev - 1));
      }

      // Apply coloring/highlights
      if (step.stateChanges) {
        setNodeStates(prev => {
          const next = { ...prev };
          step.stateChanges.forEach(sc => {
            next[sc.nodeId] = sc.state;
          });
          return next;
        });
      }

      await new Promise(r => setTimeout(r, 800));
    }

    // --- CLEANUP PHASE ---
    
    // 1. Sync the final data structure
    if (result.finalState) {
      setSkipList(result.finalState);
      setVisualHeight(result.finalState.height);
    }

    // 2. Wait a moment so the user sees the 'Complete' state
    await new Promise(r => setTimeout(r, 1000));

    // 3. Remove all visual state (turn back to default)
    setNodeStates({});      // Clears all colors
    setActiveLevels({});   // Resets virtual node tracking
    setInsertingValue(null); // Removes the temporary column
    setDeletedNodes({});
    setIsAnimating(false);
    setCurrentMessage("Ready");
  };
  const handleActionSubmit = () => {
    const val = parseInt(modalConfig.inputValue, 10);
    if (isNaN(val)) return;
    setModalConfig(prev => ({ ...prev, isOpen: false }));

    // Mock router based on the endpoints
    if (modalConfig.type === 'find') {
      async function fetchFind() {
        const res = await fetch(`${API_BASE}/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val })
        });
        const data: OperationResult = await res.json();
        playAnimation(data);
      }
      fetchFind();
    } else if (modalConfig.type === 'insert') {
      async function fetchInsert() {
        const res = await fetch(`${API_BASE}/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val })
        });
        const data: OperationResult = await res.json();
        playAnimation(data);
      }
      fetchInsert();
    } else if (modalConfig.type === 'delete') {
      async function fetchDelete() {
        const res = await fetch(`${API_BASE}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val })
        });
        const data: OperationResult = await res.json();
        playAnimation(data);
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
    playAnimation(data);
  }
  fetchReset();
  }

  useEffect(() => {
    async function fetchInitialState() {
      const res = await fetch(`${API_BASE}/state`);
      const data = await res.json();
      setSkipList(data);
      setVisualHeight(data.height);
    }
    fetchInitialState();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold mb-2">Skip List Visualizer</h1>
          <div className="flex items-center gap-3">
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isAnimating ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <p className="text-lg font-mono text-slate-600">{currentMessage}</p>
          </div>
        </div>

        {/* Grid Component */}
        <SkipListGrid 
          skipList={skipList} 
          nodeStates={nodeStates} 
          insertingValue={insertingValue} 
          activeLevels={activeLevels} 
          deletedNodes={deletedNodes}
          visualHeight={visualHeight}
        />

        {/* Controls */}
        <div className="flex gap-4">
          {['find', 'insert', 'delete'].map(action => (
            <button 
              key={action}
              disabled={isAnimating} 
              onClick={() => setModalConfig({ isOpen: true, type: action as any, inputValue: '' })} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold capitalize disabled:opacity-50 transition-colors"
            >
              {action}
            </button>
          ))}
          <button 
            disabled={isAnimating} 
            onClick={() => handleReset()} 
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
          >
            Reset
          </button>
        </div>

      </div>

      {/* Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 capitalize">{modalConfig.type} Node</h2>
            <input 
              type="number" autoFocus
              className="w-full border-2 border-slate-200 rounded-lg p-3 text-lg mb-4 focus:border-blue-500 focus:outline-none"
              placeholder="Enter a decimal number..."
              value={modalConfig.inputValue}
              onChange={(e) => setModalConfig(prev => ({ ...prev, inputValue: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleActionSubmit()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleActionSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 capitalize">{modalConfig.type}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}