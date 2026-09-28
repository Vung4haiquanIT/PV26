import { SimulationState, SimulationObject, Position, ScenarioEvent, ObjectStatus } from '../types';
import { cloneSimulationObject } from './simulationUtils';

/**
 * Normalizes heading angle to 0 - 360 degrees.
 */
export const normalizeHeading = (heading: number): number => {
  let h = heading % 360;
  if (h < 0) h += 360;
  return parseFloat(h.toFixed(1));
};

/**
 * Calculates Euclidean distance between two positions in km.
 */
export const calculateDistance = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(2));
};

/**
 * Calculates bearing from point 'from' to point 'to' in degrees (0 - 360).
 */
export const calculateBearing = (from: { x: number; y: number }, to: { x: number; y: number }): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // In our tactical grid: y is North (cos), x is East (sin)
  const rad = Math.atan2(dx, dy);
  let deg = rad * (180 / Math.PI);
  return normalizeHeading(deg);
};

/**
 * Calculates relative position metrics between two points.
 */
export const calculateRelativePosition = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const distance = calculateDistance(a, b);
  const bearing = calculateBearing(a, b);
  const deltaX = parseFloat((b.x - a.x).toFixed(2));
  const deltaY = parseFloat((b.y - a.y).toFixed(2));
  return { distance, bearing, deltaX, deltaY };
};

/**
 * Advances a simulation object based on its heading, speed, and deltaTime.
 */
export const advanceObject = (obj: SimulationObject, deltaTime: number, speedFactor: number): SimulationObject => {
  if (obj.type === 'OWN_SHIP') return cloneSimulationObject(obj);
  if (obj.status === 'ĐÃ TIÊU DIỆT' || obj.status === 'ĐÃ NỔ / VA CHẠM') return cloneSimulationObject(obj);

  const headingRad = (obj.heading * Math.PI) / 180;
  // Conversion factor: speed in knots or m/s scaled for tactical map display (km)
  // e.g. 0.005 factor per unit speed per second
  const movementFactor = 0.005 * (obj.speed / 10) * speedFactor * deltaTime;
  const dx = Math.sin(headingRad) * movementFactor;
  const dy = Math.cos(headingRad) * movementFactor;

  const newX = parseFloat((obj.position.x + dx).toFixed(2));
  const newY = parseFloat((obj.position.y + dy).toFixed(2));

  const distanceToShip = calculateDistance({ x: newX, y: newY }, { x: 0, y: 0 });
  let status: ObjectStatus = obj.status;
  if (distanceToShip <= 0.8) {
    status = 'ĐÃ NỔ / VA CHẠM';
  }

  let newAltitude = obj.altitude;
  if (obj.type === 'UAV' && obj.altitude > 0) {
    const initialDist = obj.range || 15;
    const altRatio = Math.max(0, distanceToShip / initialDist);
    newAltitude = Math.max(0, parseFloat((obj.altitude * altRatio).toFixed(1)));
  }

  const newHistory = [...obj.history, { x: newX, y: newY }];
  if (newHistory.length > 50) newHistory.shift();

  return {
    ...obj,
    position: { x: newX, y: newY, z: newAltitude },
    altitude: newAltitude,
    range: distanceToShip,
    bearing: calculateBearing({ x: 0, y: 0 }, { x: newX, y: newY }),
    status,
    history: newHistory
  };
};

/**
 * Detects dynamic simulation events between previous state and next state.
 */
export const detectEvents = (prevState: SimulationState, nextState: SimulationState): ScenarioEvent[] => {
  const newEvents: ScenarioEvent[] = [];
  const currentTime = Math.floor(nextState.time);

  nextState.objects.forEach(nextObj => {
    const prevObj = prevState.objects.find(o => o.id === nextObj.id);
    if (prevObj) {
      if (prevObj.status !== nextObj.status && nextObj.status === 'ĐÃ NỔ / VA CHẠM') {
        newEvents.push({
          id: `ev-collision-${nextObj.id}-${currentTime}`,
          time: currentTime,
          title: `Cảnh báo va chạm / Nổ mục tiêu: ${nextObj.name}`,
          description: `Đối tượng ${nextObj.name} đã tiếp cận cự ly va chạm (< 0.8 km) với tàu chiến đấu.`,
          type: 'WARNING'
        });
      }
    }
  });

  return newEvents;
};

/**
 * Simulation Engine core tick function.
 * Immutably advances the simulation state by deltaTime.
 */
export const tick = (state: SimulationState, deltaTime: number = 0.5): SimulationState => {
  if (!state.isPlaying) return state;

  const nextTime = state.time + deltaTime * state.speed;
  if (nextTime >= state.duration) {
    return {
      ...state,
      isPlaying: false,
      time: state.duration
    };
  }

  const updatedObjects = state.objects.map(obj => advanceObject(obj, deltaTime, state.speed));

  const nextStateDraft: SimulationState = {
    ...state,
    time: nextTime,
    objects: updatedObjects
  };

  const detected = detectEvents(state, nextStateDraft);
  const updatedEvents = detected.length > 0 ? [...detected, ...state.events] : state.events;

  return {
    ...nextStateDraft,
    events: updatedEvents
  };
};
