import { Scenario, SimulationState } from '../types';
import { calculateRequiredDuration } from '../simulation/SimulationEngine';

export const initialScenarioData: Scenario = {
  id: 'sc-01',
  name: 'Kịch bản đối phó bầy đàn UAV kết hợp USV cao tốc',
  description: 'Tình huống giả định tàu chiến đấu mặt nước bị tấn công đồng thời bởi 1 UAV trinh sát/tự sát FPV (UAV-01) từ hướng Đông-Bắc và 1 USV mang thuốc nổ (USV-01) từ hướng Đông.',
  initialState: {
    ownShip: {
      id: 'own-ship',
      name: 'Tàu chiến đấu mặt nước (FFG)',
      type: 'OWN_SHIP',
      position: { x: 0, y: 0, lat: '10°45\'N', lng: '106°40\'E' },
      heading: 0,
      speed: 18.0,
      altitude: 0,
      status: 'SẢN SÀNG',
      timestamp: '10:30:15',
      history: [{ x: 0, y: 0 }]
    },
    objects: [
      {
        id: 'uav-01',
        name: 'UAV-01 (FPV / Trinh sát)',
        type: 'UAV',
        position: { x: 8.5, y: 9.1 }, // ~12.5km distance
        initialPosition: { x: 8.5, y: 9.1 },
        initialAltitude: 800,
        heading: 225,
        speed: 65, // m/s (~126 knots)
        altitude: 800,
        status: 'BÁO ĐỘNG',
        timestamp: '10:30:15',
        range: 12.5,
        bearing: 45,
        rcs: 0.1,
        history: [{ x: 8.5, y: 9.1 }]
      },
      {
        id: 'usv-01',
        name: 'USV-01 (Tự sát cao tốc)',
        type: 'USV',
        position: { x: 6.8, y: 0.5 }, // ~6.8km distance
        initialPosition: { x: 6.8, y: 0.5 },
        heading: 270,
        speed: 28, // knots
        altitude: 0,
        status: 'MỤC TIÊU KHÓA',
        timestamp: '10:30:15',
        range: 6.8,
        bearing: 85,
        rcs: 2.5,
        history: [{ x: 6.8, y: 0.5 }]
      },
      {
        id: 'target-02',
        name: 'Tàu lạ (Khả nghi)',
        type: 'TARGET',
        position: { x: 15.2, y: 10.1 }, // ~18.2km
        initialPosition: { x: 15.2, y: 10.1 },
        heading: 190,
        speed: 14,
        altitude: 0,
        status: 'TUẦN TRA',
        timestamp: '10:30:15',
        range: 18.2,
        bearing: 140,
        rcs: 15.0,
        history: [{ x: 15.2, y: 10.1 }]
      }
    ]
  },
  environment: {
    weather: 'Tốt',
    seaState: 2,
    windSpeed: 12,
    visibility: 22,
    timeOfDay: '10:30:15',
    lighting: 'Nắng'
  },
  events: [
    { id: 'ev-1', time: 15, title: 'Phát hiện mục tiêu bay', description: 'Radar 3D phát hiện vật thể bay nhỏ (UAV-01) cự ly 12.5km, góc phương vị 045°.', type: 'WARNING' },
    { id: 'ev-2', time: 30, title: 'Phát hiện xuồng cao tốc', description: 'Trạm quang điện tử nhận diện USV-01 tốc độ cao hướng về mạn phải tàu.', type: 'WARNING' },
    { id: 'ev-3', time: 45, title: 'Kích hoạt hệ thống phòng thủ', description: 'AI Solver đề xuất kích hoạt gây nhiễu điện tử hướng 045° và sẵn sàng hỏa lực cận chiến.', type: 'ACTION' },
    { id: 'ev-4', time: 90, title: 'Đánh chặn thành công mục tiêu', description: 'Mô phỏng hoàn thành quy trình đối phó UAV/USV.', type: 'ENGAGEMENT' }
  ],
  branches: [
    {
      id: 'branch-0',
      name: 'Nhánh 0: Diễn biến chuẩn (Gây nhiễu + Hỏa lực cận)',
      description: 'Phát hiện sớm, kích hoạt gây nhiễu điện tử chống UAV và cơ động né tránh USV.',
      condition: 'Tiêu chuẩn',
      simulationTime: 90,
      expectedStatus: 'An toàn',
      objects: [],
      isActive: true
    },
    {
      id: 'branch-1',
      name: 'Nhánh A: Cơ động đổi hướng 30° mạn trái',
      description: 'Đổi hướng tàu sang trái để mở rộng góc bắn và giảm tốc độ tiếp cận của USV.',
      condition: 'Góc né tránh 30°',
      simulationTime: 90,
      expectedStatus: 'Giảm cự ly nguy hiểm',
      objects: [],
      isActive: false
    },
    {
      id: 'branch-2',
      name: 'Nhánh B: Kích hoạt tổ hợp PK tầm gần (CIWS)',
      description: 'Sử dụng pháo tự động cao tốc tiêu diệt UAV ở cự ly 2.5km.',
      condition: 'Cự ly < 3km',
      simulationTime: 90,
      expectedStatus: 'Tiêu diệt UAV',
      objects: [],
      isActive: false
    }
  ],
  trainingCriteria: {
    maxResponseTime: 30,
    minDistanceCPA: 1.5,
    requiredAction: 'Kích hoạt gây nhiễu điện tử & Cơ động né tránh'
  }
};

export const createInitialSimulationState = (): SimulationState => ({
  time: 0,
  duration: calculateRequiredDuration(initialScenarioData.initialState.objects),
  isPlaying: false,
  speed: 1,
  currentScenario: initialScenarioData,
  objects: initialScenarioData.initialState.objects,
  selectedObjectId: 'uav-01',
  environment: initialScenarioData.environment,
  branches: initialScenarioData.branches,
  activeBranchId: 'branch-0',
  events: initialScenarioData.events,
  solvers: [
    {
      solverId: 'sol-01',
      problemName: 'Tính toán điểm hội tụ (CPA) & Thời gian tiếp cận USV',
      inputSummary: 'USV-01 v=28kts, H=270°, Own v=18kts, H=000°',
      cpa: 0.85, // km
      timeToCPA: 142, // seconds
      recommendedAction: 'Cơ động bẻ lái trái 25 độ, tăng tốc lên 22kts để tách góc va chạm.',
      validationStatus: 'CẢNH BÁO',
      confidence: 94.5
    },
    {
      solverId: 'sol-02',
      problemName: 'Đánh giá quỹ đạo bay UAV FPV',
      inputSummary: 'UAV-01 v=65m/s, Alt=800m, H=225°',
      cpa: 0.2,
      timeToCPA: 68,
      recommendedAction: 'Kích hoạt tổ hợp gây nhiễu thông tin điều khiển (Jammer) ở giây thứ 45.',
      validationStatus: 'NGUY HIỂM',
      confidence: 98.2
    }
  ],
  trainingSession: {
    mode: 'HỌC',
    scenarioId: 'sc-01',
    status: 'IDLE',
    startTime: Date.now(),
    elapsedTime: 90,
    score: 85,
    evaluations: [
      { criterion: 'Phát hiện mục tiêu đúng thời hạn', passed: true, notes: 'Phát hiện trong vòng 12s đầu' },
      { criterion: 'Xác định loại mục tiêu chính xác', passed: true, notes: 'Nhận diện đúng UAV FPV và USV' },
      { criterion: 'Đề xuất phương án đối phó', passed: true, notes: 'Lựa chọn phương án Gây nhiễu phù hợp' }
    ]
  },
  replayHistory: [
    { timestamp: 0, state: { time: 0, objects: [] }, action: 'Khởi tạo kịch bản' },
    { timestamp: 30, state: { time: 30, objects: [] }, action: 'Phát hiện radar' },
    { timestamp: 90, state: { time: 90, objects: [] }, action: 'Kích hoạt AI Analysis' }
  ],
  activeTab: '2d',
  radarRange: 80,
  radarMode: 'RADAR 360°',
  viewMode: '2D+3D'
});
