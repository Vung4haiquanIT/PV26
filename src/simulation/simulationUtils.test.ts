import { createInitialSimulationState } from '../scenario/initialScenario';
import { cloneSimulationState, cloneSimulationObject, createSnapshot } from './simulationUtils';

// Verification tests for Phase 2
export const runPhase2Tests = () => {
  // Test 1: Initial state validity
  const state1 = createInitialSimulationState();
  if (!state1 || !state1.objects || state1.objects.length === 0) {
    throw new Error('TEST 1 FAILED: Initial SimulationState is invalid.');
  }

  // Test 2: Deep clone simulation state
  const snapshot = cloneSimulationState(state1);
  snapshot.objects[0].position.x = 999;
  if (state1.objects[0].position.x === 999) {
    throw new Error('TEST 2 FAILED: cloneSimulationState did not perform deep clone (shared reference detected).');
  }

  // Test 3: Deep clone simulation object history
  const obj = state1.objects[1];
  const clonedObj = cloneSimulationObject(obj);
  clonedObj.history.push({ x: 888, y: 888 });
  if (obj.history.length === clonedObj.history.length) {
    throw new Error('TEST 3 FAILED: cloneSimulationObject did not deep clone history array.');
  }

  // Test 4: Deterministic initial state
  const stateA = createInitialSimulationState();
  const stateB = createInitialSimulationState();
  if (stateA.objects[0].position.x !== stateB.objects[0].position.x || stateA.time !== stateB.time) {
    throw new Error('TEST 4 FAILED: Initial state is not deterministic.');
  }

  console.log('ALL PHASE 2 TESTS PASSED SUCCESSFULLY.');
};

// Execute on import/load
try {
  runPhase2Tests();
} catch (e) {
  console.error(e);
}
