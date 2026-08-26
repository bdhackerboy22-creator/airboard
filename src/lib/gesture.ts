import { Landmark } from '../types/hand';

/**
 * Checks if a specific finger is extended.
 * For index, middle, ring, and pinky, we compare the y-coordinate of the tip with the MCP joint.
 * Since y increases downwards, tip.y < mcp.y means the finger is pointing up/extended.
 */
export function isFingerExtended(
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark
): boolean {
  // Finger is extended if tip is higher (smaller y) than PIP and MCP
  return tip.y < pip.y && pip.y < mcp.y;
}

/**
 * Check if thumb is extended.
 * We can compare thumb tip x coordinate with thumb IP and MCP coordinates,
 * taking into account hand orientation (handedness), but a general distance/x comparison works.
 */
export function isThumbExtended(
  tip: Landmark,
  ip: Landmark,
  mcp: Landmark,
  wrist: Landmark
): boolean {
  // Approximate thumb extension by checking its horizontal distance from wrist or MCP
  const distTipWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const distMcpWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
  return distTipWrist > distMcpWrist * 1.1;
}

export type GestureType = 'none' | 'hover' | 'draw' | 'erase';

/**
 * Detect gesture from MediaPipe landmarks
 */
export function detectGesture(landmarks: Landmark[]): GestureType {
  if (!landmarks || landmarks.length < 21) return 'none';

  // Finger joints
  const wrist = landmarks[0];
  
  // Thumb: 4 (tip), 3 (IP), 2 (MCP)
  const thumbExtended = isThumbExtended(landmarks[4], landmarks[3], landmarks[2], wrist);
  
  // Index: 8 (tip), 7 (DIP), 6 (PIP), 5 (MCP)
  const indexExtended = isFingerExtended(landmarks[8], landmarks[6], landmarks[5]);
  
  // Middle: 12 (tip), 11 (DIP), 10 (PIP), 9 (MCP)
  const middleExtended = isFingerExtended(landmarks[12], landmarks[10], landmarks[9]);
  
  // Ring: 16 (tip), 15 (DIP), 14 (PIP), 13 (MCP)
  const ringExtended = isFingerExtended(landmarks[16], landmarks[14], landmarks[13]);
  
  // Pinky: 20 (tip), 19 (DIP), 18 (PIP), 17 (MCP)
  const pinkyExtended = isFingerExtended(landmarks[20], landmarks[18], landmarks[17]);

  // Count how many fingers are extended (excluding thumb for simple calculations)
  const extendedCount = 
    (indexExtended ? 1 : 0) + 
    (middleExtended ? 1 : 0) + 
    (ringExtended ? 1 : 0) + 
    (pinkyExtended ? 1 : 0);

  // 1. ERASE Gesture: All fingers extended (index, middle, ring, pinky, and possibly thumb)
  if (extendedCount >= 4) {
    return 'erase';
  }

  // 2. DRAW Gesture: Index finger is extended and middle finger is folded
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return 'draw';
  }

  // 3. HOVER Gesture: Index and middle fingers are extended (pointing gesture)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return 'hover';
  }

  // Fallback default: if index is extended, treat as hover
  if (indexExtended) {
    return 'hover';
  }

  return 'none';
}
