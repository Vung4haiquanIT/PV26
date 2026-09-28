import { SimulationState, SimulationObject, Position, ScenarioBranch, ScenarioEvent, SolverResult } from '../types';

export const clonePosition = (pos: Position): Position => ({
  x: pos.x,
  y: pos.y,
  z: pos.z,
  lat: pos.lat,
  lng: pos.lng
});

export const cloneSimulationObject = (obj: SimulationObject): SimulationObject => ({
  ...obj,
  position: clonePosition(obj.position),
  history: obj.history.map(clonePosition)
});

export const cloneScenarioBranch = (branch: ScenarioBranch): ScenarioBranch => ({
  ...branch,
  initialState: branch.initialState ? {
    ownShip: branch.initialState.ownShip ? cloneSimulationObject(branch.initialState.ownShip) : undefined,
    objects: branch.initialState.objects.map(cloneSimulationObject)
  } : undefined,
  finalState: branch.finalState ? {
    objects: branch.finalState.objects.map(cloneSimulationObject)
  } : undefined,
  objects: branch.objects.map(cloneSimulationObject),
  events: branch.events ? branch.events.map(e => ({ ...e })) : undefined,
  solverResults: branch.solverResults ? branch.solverResults.map(s => ({ ...s })) : undefined
});

export const cloneSimulationState = (state: SimulationState): SimulationState => {
  return {
    ...state,
    currentScenario: {
      ...state.currentScenario,
      initialState: {
        ownShip: cloneSimulationObject(state.currentScenario.initialState.ownShip),
        objects: state.currentScenario.initialState.objects.map(cloneSimulationObject)
      },
      environment: { ...state.currentScenario.environment },
      events: state.currentScenario.events.map(e => ({ ...e })),
      branches: state.currentScenario.branches.map(cloneScenarioBranch),
      trainingCriteria: { ...state.currentScenario.trainingCriteria }
    },
    objects: state.objects.map(cloneSimulationObject),
    environment: { ...state.environment },
    branches: state.branches.map(cloneScenarioBranch),
    events: state.events.map(e => ({ ...e })),
    solvers: state.solvers.map(s => ({ ...s })),
    solverResults: state.solverResults ? state.solverResults.map(s => ({ ...s })) : undefined,
    trainingSession: {
      ...state.trainingSession,
      evaluations: state.trainingSession.evaluations.map(ev => ({ ...ev }))
    },
    replayHistory: state.replayHistory.map(r => ({
      ...r,
      state: {
        time: r.state.time,
        objects: r.state.objects.map(cloneSimulationObject)
      }
    }))
  };
};

export const createSnapshot = (state: SimulationState): SimulationState => {
  return cloneSimulationState(state);
};
