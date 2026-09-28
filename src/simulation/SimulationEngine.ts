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

  const initPos = obj.initialPosition || obj.position;
  const initialDist = calculateDistance(initPos, { x: 0, y: 0 });
  const speed = obj.speed || 30;
  const speedKmPerSec = 0.005 * (speed / 10);

  const headingRad = (obj.heading * Math.PI) / 180;
  const movementFactor = speedKmPerSec * speedFactor * deltaTime;
  const dx = Math.sin(headingRad) * movementFactor;
  const dy = Math.cos(headingRad) * movementFactor;

  const newX = parseFloat((obj.position.x + dx).toFixed(2));
  const newY = parseFloat((obj.position.y + dy).toFixed(2));

  const distanceToShip = calculateDistance({ x: newX, y: newY }, { x: 0, y: 0 });
  let status: ObjectStatus = obj.status;
  let finalX = newX;
  let finalY = newY;

  if (distanceToShip <= 0.8) {
    status = 'ĐÃ NỔ / VA CHẠM';
    const dxShip = 0 - initPos.x;
    const dyShip = 0 - initPos.y;
    const distShip = Math.sqrt(dxShip * dxShip + dyShip * dyShip);
    if (distShip > 0.8) {
      const ux = dxShip / distShip;
      const uy = dyShip / distShip;
      finalX = parseFloat((0 - ux * 0.8).toFixed(2));
      finalY = parseFloat((0 - uy * 0.8).toFixed(2));
    }
  }

  let newAltitude = obj.altitude;
  const initAlt = obj.initialAltitude !== undefined ? obj.initialAltitude : (obj.altitude || 400);
  if (obj.type === 'UAV' && initAlt > 0) {
    const travelDistToImpact = Math.max(0, initialDist - 0.8);
    const progress = initialDist > 0.8 ? Math.min(1, Math.max(0, (initialDist - distanceToShip) / travelDistToImpact)) : 1;
    newAltitude = status === 'ĐÃ NỔ / VA CHẠM' ? 0 : Math.max(0, parseFloat((initAlt * (1 - progress)).toFixed(1)));
  }

  const newHistory = [...obj.history, { x: finalX, y: finalY }];
  if (newHistory.length > 50) newHistory.shift();

  return {
    ...obj,
    position: { x: finalX, y: finalY, z: newAltitude },
    altitude: newAltitude,
    range: calculateDistance({ x: finalX, y: finalY }, { x: 0, y: 0 }),
    bearing: calculateBearing({ x: 0, y: 0 }, { x: finalX, y: finalY }),
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
 * Calculates required simulation duration based on furthest/slowest target.
 */
export const calculateRequiredDuration = (objects: SimulationObject[]): number => {
  let maxSecs = 60;
  objects.forEach(obj => {
    if (obj.type === 'OWN_SHIP' || obj.type === 'WAYPOINT') return;
    const initPos = obj.initialPosition || obj.position;
    const rangeKm = calculateDistance(initPos, { x: 0, y: 0 });
    const travelDist = Math.max(0, rangeKm - 0.8);
    const speed = obj.speed || 30;
    const speedKmPerSec = 0.005 * (speed / 10);
    if (speedKmPerSec > 0) {
      const timeToImpact = travelDist / speedKmPerSec;
      if (timeToImpact > maxSecs) {
        maxSecs = timeToImpact;
      }
    }
  });
  return Math.ceil(maxSecs + 10);
};

/**
 * Computes simulation state at any exact target time from initial positions.
 */
export const getStateAtTime = (state: SimulationState, targetTime: number): SimulationState => {
  const isInterceptionActive = state.interceptionConfig?.active;
  const impactDist = isInterceptionActive ? 4.0 : 0.8;

  const updatedObjects = state.objects.map(obj => {
    if (obj.type === 'OWN_SHIP' || obj.type === 'WAYPOINT') return cloneSimulationObject(obj);
    const initPos = obj.initialPosition || obj.position;
    const speed = obj.speed || 30;
    const speedKmPerSec = 0.005 * (speed / 10);
    const initialDist = calculateDistance(initPos, { x: 0, y: 0 });
    const travelDistToImpact = Math.max(0, initialDist - impactDist);
    const timeToImpact = speedKmPerSec > 0 ? travelDistToImpact / speedKmPerSec : 999999;

    let x: number, y: number, altitude: number, status: ObjectStatus, distanceToShip: number;

    if (targetTime >= timeToImpact) {
      distanceToShip = impactDist;
      status = isInterceptionActive ? 'ĐÃ TIÊU DIỆT' : 'ĐÃ NỔ / VA CHẠM';
      altitude = 0;
      const dx = 0 - initPos.x;
      const dy = 0 - initPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > impactDist) {
        const ux = dx / dist;
        const uy = dy / dist;
        x = parseFloat((0 - ux * impactDist).toFixed(2));
        y = parseFloat((0 - uy * impactDist).toFixed(2));
      } else {
        x = initPos.x;
        y = initPos.y;
      }
    } else {
      const totalMovement = speedKmPerSec * targetTime;
      const headingRad = (obj.heading * Math.PI) / 180;
      x = parseFloat((initPos.x + Math.sin(headingRad) * totalMovement).toFixed(2));
      y = parseFloat((initPos.y + Math.cos(headingRad) * totalMovement).toFixed(2));

      distanceToShip = calculateDistance({ x, y }, { x: 0, y: 0 });
      if (distanceToShip <= impactDist) {
        status = isInterceptionActive ? 'ĐÃ TIÊU DIỆT' : 'ĐÃ NỔ / VA CHẠM';
        altitude = 0;
        const dx = 0 - initPos.x;
        const dy = 0 - initPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > impactDist) {
          const ux = dx / dist;
          const uy = dy / dist;
          x = parseFloat((0 - ux * impactDist).toFixed(2));
          y = parseFloat((0 - uy * impactDist).toFixed(2));
        }
      } else {
        status = obj.type === 'UAV' ? 'BÁO ĐỘNG' : 'MỤC TIÊU KHÓA';
        const initAlt = obj.initialAltitude !== undefined ? obj.initialAltitude : (obj.altitude || 400);
        altitude = obj.altitude;
        if (obj.type === 'UAV' && initAlt > 0) {
          const progress = initialDist > impactDist ? Math.min(1, Math.max(0, (initialDist - distanceToShip) / travelDistToImpact)) : 1;
          altitude = Math.max(0, parseFloat((initAlt * (1 - progress)).toFixed(1)));
        }
      }
    }

    const history = [{ x: initPos.x, y: initPos.y }, { x, y }];

    return {
      ...obj,
      position: { x, y, z: altitude },
      altitude,
      range: distanceToShip,
      bearing: calculateBearing({ x: 0, y: 0 }, { x, y }),
      status,
      history
    };
  });

  return {
    ...state,
    time: targetTime,
    objects: updatedObjects
  };
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

  const nextStateDraft = getStateAtTime(state, nextTime);
  const detected = detectEvents(state, nextStateDraft);
  const updatedEvents = detected.length > 0 ? [...detected, ...state.events] : state.events;

  return {
    ...nextStateDraft,
    events: updatedEvents
  };
};
