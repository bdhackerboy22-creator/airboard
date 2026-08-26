/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PeerJS CDN loader
 */

declare global {
  interface Window {
    Peer: any;
  }
}

const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if ((existing as any).ready) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.addEventListener('load', () => {
      (script as any).ready = true;
      resolve();
    });
    
    script.addEventListener('error', (e) => {
      reject(e);
    });

    document.head.appendChild(script);
  });
}

/**
 * Ensures PeerJS library is loaded from CDN
 */
export async function loadPeerJS(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PeerJS can only be loaded in the browser.');
  }

  if (window.Peer) {
    return window.Peer;
  }

  await loadScript(PEERJS_CDN);

  if (!window.Peer) {
    throw new Error('PeerJS script loaded but global Peer object is missing.');
  }

  return window.Peer;
}
