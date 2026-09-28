import { SimulationObject, SolverResult, SimulationState } from '../types';
import { calculateDistance, calculateBearing } from '../simulation/SimulationEngine';

/**
 * Distance Solver: Computes precise distances from Own Ship to all active tactical objects.
 */
export const solveDistance = (objects: SimulationObject[]): SolverResult[] => {
  const ownShip = objects.find(o => o.type === 'OWN_SHIP') || { position: { x: 0, y: 0 } };
  const targets = objects.filter(o => o.type !== 'OWN_SHIP');

  return targets.map(target => {
    const dist = calculateDistance(ownShip.position, target.position);
    const isDangerous = dist < 3.0;
    return {
      solverId: `sol-dist-${target.id}`,
      problemName: `Solver Khoảng cách (Distance Solver) - ${target.name}`,
      inputSummary: `Tọa độ Tàu: (0,0), ${target.name}: (${target.position.x}, ${target.position.y}) km`,
      cpa: dist,
      timeToCPA: 0,
      recommendedAction: isDangerous ? `Cự ly dưới ngưỡng an toàn (3km). Sẵn sàng phương án phòng thủ.` : `Cự ly tầm trung, duy trì giám sát radar.`,
      validationStatus: isDangerous ? 'NGUY HIỂM' : dist < 6 ? 'CẢNH BÁO' : 'ĐẠT',
      confidence: 99.8,
      timestamp: new Date().toISOString()
    };
  });
};

/**
 * Bearing Solver: Computes precise bearing angles and relative orientation.
 */
export const solveBearing = (objects: SimulationObject[]): SolverResult[] => {
  const ownShip = objects.find(o => o.type === 'OWN_SHIP') || { position: { x: 0, y: 0 } };
  const targets = objects.filter(o => o.type !== 'OWN_SHIP');

  return targets.map(target => {
    const bearing = calculateBearing(ownShip.position, target.position);
    return {
      solverId: `sol-bearing-${target.id}`,
      problemName: `Solver Phương vị (Bearing Solver) - ${target.name}`,
      inputSummary: `Phương vị từ Mũi tàu đến ${target.name}: ${bearing}°`,
      cpa: calculateDistance(ownShip.position, target.position),
      timeToCPA: 0,
      recommendedAction: `Hướng góc phương vị ${bearing}° so với hướng bắc từ tâm tàu. Quay đài ra đa hướng ${bearing}° để khóa mục tiêu.`,
      validationStatus: 'ĐẠT',
      confidence: 99.5,
      timestamp: new Date().toISOString()
    };
  });
};

/**
 * Relative Motion Solver: Computes relative velocity vector and closing speed.
 */
export const solveRelativeMotion = (objects: SimulationObject[]): SolverResult[] => {
  const ownShip = objects.find(o => o.type === 'OWN_SHIP') || { speed: 18, heading: 0 };
  const targets = objects.filter(o => o.type !== 'OWN_SHIP');

  return targets.map(target => {
    // Vector velocity calculations (deterministic physics)
    const ownRad = (ownShip.heading * Math.PI) / 180;
    const ownVx = ownShip.speed * Math.sin(ownRad);
    const ownVy = ownShip.speed * Math.cos(ownRad);

    const tgtRad = (target.heading * Math.PI) / 180;
    const tgtVx = target.speed * Math.sin(tgtRad);
    const tgtVy = target.speed * Math.cos(tgtRad);

    const relVx = tgtVx - ownVx;
    const relVy = tgtVy - ownVy;
    const closingSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

    return {
      solverId: `sol-rel-motion-${target.id}`,
      problemName: `Solver Chuyển động tương đối (Relative Motion) - ${target.name}`,
      inputSummary: `Tốc độ tương đối tiếp cận: ${closingSpeed.toFixed(1)} kts (${target.name} v=${target.speed}kts, H=${target.heading}°)`,
      cpa: target.range || 5,
      timeToCPA: closingSpeed > 0 ? Math.round(((target.range || 5) * 1852) / (closingSpeed * 0.51444 / 60)) : 999,
      recommendedAction: `Tốc độ tiến sát tương đối: ${closingSpeed.toFixed(1)} hải lý/giờ. Điều chỉnh hướng cơ động góc vuông nếu cự ly tiếp tục giảm.`,
      validationStatus: closingSpeed > 20 ? 'NGUY HIỂM' : 'CẢNH BÁO',
      confidence: 97.2,
      timestamp: new Date().toISOString()
    };
  });
};

/**
 * CPA Solver: Closest Point of Approach calculation using kinematic vector projection.
 */
export const solveCPA = (objects: SimulationObject[]): SolverResult[] => {
  const ownShip = objects.find(o => o.type === 'OWN_SHIP') || { position: { x: 0, y: 0 }, speed: 18, heading: 0 };
  const targets = objects.filter(o => o.type !== 'OWN_SHIP');

  return targets.map(target => {
    // Relative position vector (dx, dy in km)
    const dx = target.position.x - ownShip.position.x;
    const dy = target.position.y - ownShip.position.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);

    // Approximate CPA estimation based on velocity vectors and current separation
    const ownRad = (ownShip.heading * Math.PI) / 180;
    const tgtRad = (target.heading * Math.PI) / 180;

    const relSpeedX = (target.speed * Math.sin(tgtRad) - ownShip.speed * Math.sin(ownRad)) * 0.51444 / 1000; // km/s roughly
    const relSpeedY = (target.speed * Math.cos(tgtRad) - ownShip.speed * Math.cos(ownRad)) * 0.51444 / 1000;

    const speedSq = relSpeedX * relSpeedX + relSpeedY * relSpeedY;
    let tCpa = 0;
    let cpaDist = currentDist;

    if (speedSq > 0.000001) {
      tCpa = Math.max(0, - (dx * relSpeedX + dy * relSpeedY) / speedSq);
      const closestX = dx + relSpeedX * tCpa;
      const closestY = dy + relSpeedY * tCpa;
      cpaDist = Math.max(0.1, parseFloat(Math.sqrt(closestX * closestX + closestY * closestY).toFixed(2)));
    }

    const timeToCpaSec = Math.round(tCpa);
    const isCritical = cpaDist < 1.5;

    return {
      solverId: `sol-cpa-${target.id}`,
      problemName: `Solver Điểm hội tụ cận nhất (CPA) - ${target.name}`,
      inputSummary: `Cự ly CPA dự báo: ${cpaDist} km tại thời điểm t=${timeToCpaSec}s`,
      cpa: cpaDist,
      timeToCPA: timeToCpaSec,
      recommendedAction: isCritical 
        ? `CPA nguy hiểm (${cpaDist} km < 1.5 km). Khuyến nghị bẻ lái trái 30 độ hoặc tăng tốc lên 22 kts ngay lập tức.` 
        : `CPA trong giới hạn an toàn (${cpaDist} km). Tiếp tục giám sát quỹ đạo.`,
      validationStatus: isCritical ? 'NGUY HIỂM' : cpaDist < 3 ? 'CẢNH BÁO' : 'ĐẠT',
      confidence: 98.9,
      timestamp: new Date().toISOString()
    };
  });
};

/**
 * Master Solver Registry runner that invokes all solvers and aggregates deterministic results.
 */
export const runSolverRegistry = (state: SimulationState): SolverResult[] => {
  const objects = state.objects;
  const distResults = solveDistance(objects);
  const bearingResults = solveBearing(objects);
  const relMotionResults = solveRelativeMotion(objects);
  const cpaResults = solveCPA(objects);

  // Combine results while preserving previous confirmation statuses if solverId matches
  const prevMap = new Map(state.solvers.map(s => [s.solverId, s]));

  const allResults = [
    ...cpaResults,
    ...relMotionResults,
    ...distResults,
    ...bearingResults
  ];

  return allResults.map(res => {
    const existing = prevMap.get(res.solverId);
    if (existing && existing.confirmed) {
      return {
        ...res,
        confirmed: true,
        confirmedAt: existing.confirmedAt
      };
    }
    return res;
  });
};
