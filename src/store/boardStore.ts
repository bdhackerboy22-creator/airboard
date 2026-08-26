import { create } from 'zustand';
import { ToolType, Stroke, Point } from '../types/drawing';

interface BoardState {
  color: string;
  size: number;
  tool: ToolType;
  strokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  workspaceMode: 'whiteboard' | 'android';
  
  // Actions
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setTool: (tool: ToolType) => void;
  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
  undo: () => void;
  redo: () => void;
  saveStateToUndo: () => void;
  setWorkspaceMode: (mode: 'whiteboard' | 'android') => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  color: '#3b82f6', // Premium Indigo/Blue
  size: 8,
  tool: 'pen',
  strokes: [],
  undoStack: [],
  redoStack: [],
  workspaceMode: 'whiteboard',

  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
  setTool: (tool) => set({ tool }),
  
  addStroke: (stroke) =>
    set((state) => {
      const newStrokes = [...state.strokes, stroke];
      return {
        strokes: newStrokes,
        undoStack: [...state.undoStack, state.strokes],
        redoStack: [], // Clear redo stack on new action
      };
    }),
    
  clearStrokes: () =>
    set((state) => ({
      strokes: [],
      undoStack: [...state.undoStack, state.strokes],
      redoStack: [],
    })),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return {};
      const previous = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      return {
        strokes: previous,
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, state.strokes],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return {};
      const next = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);
      return {
        strokes: next,
        undoStack: [...state.undoStack, state.strokes],
        redoStack: newRedoStack,
      };
    }),

  saveStateToUndo: () =>
    set((state) => ({
      undoStack: [...state.undoStack, state.strokes],
      redoStack: [],
    })),
}));
