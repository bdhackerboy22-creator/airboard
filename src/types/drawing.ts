export type ToolType = 'pen' | 'eraser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  tool: ToolType;
}

export interface DrawingState {
  strokes: Stroke[];
  currentStroke: Point[] | null;
  undoStack: Stroke[][];
  redoStack: Stroke[][];
}
