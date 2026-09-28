import { createInitialSimulationState } from '../scenario/initialScenario';
import {
  tick,
  normalizeHeading,
  calculateDistance,
  calculateBearing,
  advanceObject
} from './SimulationEngine';

export const runSimulationEngineTests = () => {
  // Test 1: Normalize Heading
  if (normalizeHeading(370) !== 10 || normalizeHeading(-10) !== 350) {
    throw new Error('SimulationEngine Test FAILED: normalizeHeading incorrect.');
  }

  // Test 2: Calculate Distance
  const dist = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
  if (dist !== 5) {
    throw new Error('SimulationEngine Test FAILED: calculateDistance incorrect.');
  }

  // Test 3: Calculate Bearing
  const bearingNorth = calculateBearing({ x: 0, y: 0 }, { x: 0, y: 10 });
  if (bearingNorth !== 0) {
    throw new Error('SimulationEngine Test FAILED: calculateBearing North incorrect.');
  }

  // Test 4: Tick advances simulation time and does not mutate old state
  const state = createInitialSimulationState();
  state.isPlaying = true;
  const oldTime = state.time;
  const nextState = tick(state, 1.0);

  if (nextState.time <= oldTime) {
    throw new Error('SimulationEngine Test FAILED: tick did not advance time.');
  }
  if (state.time !== oldTime) {
    throw new Error('SimulationEngine Test FAILED: tick mutated old state time.');
  }

  // Test 5: Determinism (same state + same deltaTime -> same output)
  const stateA = createInitialSimulationState();
  stateA.isPlaying = true;
  const stateB = createInitialSimulationState();
  stateB.isPlaying = true;

  const resA = tick(stateA, 0.5);
  const resB = tick(stateB, 0.5);

  if (resA.time !== resB.time || resA.objects[0].position.x !== resB.objects[0].position.x) {
    throw new Error('SimulationEngine Test FAILED: Tick is not deterministic.');
  }

  // Test 6: Advance object and history update
  const testObj = state.objects[0];
  const advanced = advanceObject(testObj, 1.0, 1.0);
  if (advanced.history.length <= testObj.history.length) {
    throw new Error('SimulationEngine Test FAILED: Object history not updated.');
  }

  console.log('ALL SIMULATION ENGINE UNIT TESTS PASSED SUCCESSFULLY.');
};

try {
  runSimulationEngineTests();
} catch (e) {
  console.error(e);
}
