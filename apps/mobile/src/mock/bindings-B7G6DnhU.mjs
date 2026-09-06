// Mock bindings-B7G6DnhU.mjs that uses JSI bindings instead of WASM bindings
// This avoids the dynamic import() in the WASM module loader that Metro bundler cannot handle

// Import the JSI bindings
import { qpdfJsiBinding, ghostscriptJsiBinding } from "@acajoo/giovanni-core/bindings/jsi";

// Create binding registry using JSI bindings
let activeQpdfBinding = qpdfJsiBinding;
let activeGhostscriptBinding = ghostscriptJsiBinding;

// Binding registry functions
function getQpdfBinding() {
  return activeQpdfBinding;
}

function setQpdfBinding(binding) {
  activeQpdfBinding = binding;
}

function resetQpdfBinding() {
  activeQpdfBinding = qpdfJsiBinding; // Reset to JSI binding instead of WASM
}

function getGhostscriptBinding() {
  return activeGhostscriptBinding;
}

function setGhostscriptBinding(binding) {
  activeGhostscriptBinding = binding;
}

function resetGhostscriptBinding() {
  activeGhostscriptBinding = ghostscriptJsiBinding; // Reset to JSI binding instead of WASM
}

// Export the binding registry functions (matching the original export names)
export {
  setGhostscriptBinding as a,
  resetQpdfBinding as i,
  getQpdfBinding as n,
  setQpdfBinding as o,
  resetGhostscriptBinding as r,
  getGhostscriptBinding as t
};