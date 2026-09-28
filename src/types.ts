export type ObjectType = 'OWN_SHIP' | 'UAV' | 'USV' | 'WAYPOINT' | 'ENVIRONMENT_EVENT' | 'TARGET';

export type ObjectStatus = 'SẢN SÀNG' | 'ĐANG TIẾP CẬN' | 'BÁO ĐỘNG' | 'MỤC TIÊU KHÓA' | 'ĐÃ TIÊU DIỆT' | 'TUẦN TRA' | 'ĐÃ NỔ / VA CHẠM';

export interface Position {
  x: number; // km relative to own ship
  y: number; // km relative to own ship
  z?: number; // optional altitude coordinate
  lat?: string;
  lng?: string;
}

export interface SimulationObject {
  id: string;
  name: string;
  type: ObjectType;
  position: Position;
  heading: number; // 0 - 360 degrees
  speed: number; // knots or m/s
  altitude: number; // meters (for UAV)
  status: ObjectStatus;
  timestamp: string;
  range?: number; // km from own ship
  bearing?: number; // degrees from north
  rcs?: number; // radar cross section
  history: Position[];
}

export interface EnvironmentState {
  weather: 'Tốt' | 'Mưa nhẹ' | 'Sương mù' | 'Gió bão';
  seaState: number; // 1 to 6
  windSpeed: number; // knots
  visibility: number; // km
  timeOfDay: string; // e.g. "10:30:15"
  lighting: 'Nắng' | 'Hoàng hôn' | 'Đêm';
}

export interface ScenarioBranch {
  id: string;
  parentBranchId?: string;
  name: string;
  description: string;
  condition: string;
  simulationTime: number; // seconds
  expectedStatus: string;
  initialState?: {
    ownShip?: SimulationObject;
    objects: SimulationObject[];
  };
  finalState?: {
    objects: SimulationObject[];
  };
  objects: SimulationObject[];
  events?: ScenarioEvent[];
  solverResults?: SolverResult[];
  isActive: boolean;
}

export interface ScenarioEvent {
  id: string;
  time: number; // seconds
  title: string;
  description: string;
  type: 'WARNING' | 'ACTION' | 'INFO' | 'ENGAGEMENT';
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initialState: {
    ownShip: SimulationObject;
    objects: SimulationObject[];
  };
  environment: EnvironmentState;
  events: ScenarioEvent[];
  branches: ScenarioBranch[];
  trainingCriteria: {
    maxResponseTime: number; // seconds
    minDistanceCPA: number; // km
    requiredAction: string;
  };
}

export interface SolverResult {
  solverId: string;
  problemName: string;
  inputSummary: string;
  cpa: number; // Closest Point of Approach in km
  timeToCPA: number; // seconds
  recommendedAction: string;
  validationStatus: 'ĐẠT' | 'CẢNH BÁO' | 'NGUY HIỂM';
  confidence: number; // percentage
  timestamp?: string | number;
  confirmed?: boolean;
  confirmedAt?: string;
}

export interface TrainingSession {
  mode: 'HỌC' | 'LUYỆN' | 'KIỂM TRA' | 'HUẤN LUYỆN KÍP';
  scenarioId: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startTime: number;
  elapsedTime: number; // seconds
  score: number;
  evaluations: {
    criterion: string;
    passed: boolean;
    notes: string;
  }[];
}

export interface ReplayEvent {
  timestamp: number;
  simulationTime?: number;
  branchId?: string;
  eventType?: string;
  state: {
    time: number;
    objects: SimulationObject[];
  };
  action: string;
}

export interface SimulationState {
  time: number; // current seconds in simulation
  duration: number; // total duration e.g. 600s
  isPlaying: boolean;
  speed: number; // 0.5, 1, 2, 5, 10
  currentScenario: Scenario;
  objects: SimulationObject[];
  selectedObjectId: string | null;
  environment: EnvironmentState;
  branches: ScenarioBranch[];
  activeBranchId: string;
  events: ScenarioEvent[];
  solvers: SolverResult[];
  solverResults?: SolverResult[]; // Alias for compatibility
  trainingSession: TrainingSession;
  replayHistory: ReplayEvent[];
  activeTab: '2d' | '3d' | 'ai' | 'training' | 'scenario' | 'data';
  radarRange: number; // 20, 40, 80, 160 km
  radarMode: 'RADAR 360°' | 'SECTOR' | 'AWACS';
  viewMode: '2D+3D' | '2D_ONLY' | '3D_ONLY';
}
