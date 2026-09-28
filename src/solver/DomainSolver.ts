import { SimulationObject, SolverResult } from '../types';
import { runSolverRegistry } from './solverRegistry';

export const runDomainSolvers = (objects: SimulationObject[]): SolverResult[] => {
  // Construct dummy state wrapper for registry runner
  const dummyState: any = {
    objects,
    solvers: []
  };
  return runSolverRegistry(dummyState);
};

