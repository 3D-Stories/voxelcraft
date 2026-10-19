// src/render/WebGLSupport.js
// Pre-flight check so a browser with WebGL disabled gets actionable guidance
// instead of a Three.js context-creation stack trace.

export function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) return 2;
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) return 1;
    return 0;
  } catch {
    return 0;
  }
}
