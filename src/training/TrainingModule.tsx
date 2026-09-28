import React, { useState, useEffect } from 'react';
import { SimulationState, Scenario, SimulationObject } from '../types';
import { GraduationCap, Play, Pause, Square, RotateCcw, Award, CheckCircle, XCircle, Clock, ShieldAlert, Sparkles, Eye, BarChart2, Layers } from 'lucide-react';

interface TrainingModuleProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

// Scenario Library for Training Center
const TRAINING_SCENARIOS: Array<{
  id: string;
  name: string;
  description: string;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao' | 'Chuyên gia';
  duration: number; // seconds
  objectCount: number;
  environment: { seaState: number; visibility: number; weather: string };
  objectives: string[];
}> = [
  {
    id: 'sc-train-01',
    name: 'Đánh chặn UAV Đơn lẻ (Phòng không cơ bản)',
    description: 'Huấn luyện kíp chiến đấu nhận diện, khóa mục tiêu và kích hoạt phương án gây nhiễu điện tử chống UAV FPV tự sát.',
    difficulty: 'Cơ bản',
    duration: 300,
    objectCount: 2,
    environment: { seaState: 2, visibility: 12, weather: 'Tốt' },
    objectives: ['Phát hiện mục tiêu RCS nhỏ', 'Thiết lập hướng gây nhiễu điện tử', 'Duy trì khoảng cách CPA an toàn >2km']
  },
  {
    id: 'sc-train-02',
    name: 'Phối hợp Chống USV Cao tốc Bầy đàn',
    description: 'Đối phó đồng thời 4 xuồng tự sát không người lái (USV) tiếp cận từ mạn trái với vận tốc cao trong điều kiện sóng cấp 4.',
    difficulty: 'Nâng cao',
    duration: 450,
    objectCount: 5,
    environment: { seaState: 4, visibility: 8, weather: 'Mưa nhẹ' },
    objectives: ['Phân bổ kênh hỏa lực', 'Cơ động bẻ lái né tránh 45 độ', 'Kích hoạt màn khói ngụy trang']
  },
  {
    id: 'sc-train-03',
    name: 'Tác chiến Phức hợp Đa tầng (UAV + USV)',
    description: 'Tình huống hỗn hợp tối phức tạp: 3 UAV trinh sát trên không kết hợp 3 USV tấn công mặt nước trong sương mù dày đặc.',
    difficulty: 'Chuyên gia',
    duration: 600,
    objectCount: 7,
    environment: { seaState: 5, visibility: 3, weather: 'Sương mù' },
    objectives: ['Xử lý tình huống nhiễu loạn radar', 'Ưu tiên mục tiêu tiêu diệt theo độ nguy hiểm', 'Đảm bảo an toàn biên đội']
  },
  {
    id: 'sc-train-04',
    name: 'Diễn tập Kíp chiến đấu Tổng hợp (HQ-Task)',
    description: 'Sát hạch toàn diện khả năng vận hành của toàn bộ kíp chiến đấu trong thời gian thực với các biến cố ngẫu nhiên.',
    difficulty: 'Nâng cao',
    duration: 900,
    objectCount: 6,
    environment: { seaState: 3, visibility: 10, weather: 'Tốt' },
    objectives: ['Phối hợp trơn tru giữa Trắc thủ Radar, Pháo thủ và Cố vấn AI', 'Thời gian phản ứng < 15 giây']
  }
];

export const TrainingModule: React.FC<TrainingModuleProps> = ({ state, setState, onClose }) => {
  const training = state.trainingSession;
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(TRAINING_SCENARIOS[0].id);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTimeIndex, setReplayTimeIndex] = useState(0);
  const [showAAR, setShowAAR] = useState(false);

  const currentExercise = TRAINING_SCENARIOS.find(s => s.id === selectedScenarioId) || TRAINING_SCENARIOS[0];

  const handleModeChange = (mode: 'HỌC' | 'LUYỆN' | 'KIỂM TRA' | 'HUẤN LUYỆN KÍP') => {
    setState(s => ({
      ...s,
      trainingSession: { ...s.trainingSession, mode }
    }));
  };

  const handleStartTraining = () => {
    setState(s => ({
      ...s,
      trainingSession: {
        ...s.trainingSession,
        status: 'RUNNING',
        scenarioId: selectedScenarioId,
        startTime: Date.now(),
        elapsedTime: 0,
        score: 85
      },
      replayHistory: [
        {
          timestamp: s.time,
          action: 'BẮT ĐẦU HUẤN LUYỆN: ' + currentExercise.name,
          state: { time: s.time, objects: s.objects }
        }
      ]
    }));
    setShowAAR(false);
  };

  const handlePauseTraining = () => {
    setState(s => ({
      ...s,
      trainingSession: { ...s.trainingSession, status: 'PAUSED' }
    }));
  };

  const handleResumeTraining = () => {
    setState(s => ({
      ...s,
      trainingSession: { ...s.trainingSession, status: 'RUNNING' }
    }));
  };

  const handleStopTraining = () => {
    setState(s => ({
      ...s,
      trainingSession: { ...s.trainingSession, status: 'COMPLETED' }
    }));
    setShowAAR(true);
  };

  const handleStartReplay = () => {
    setIsReplaying(true);
    setReplayTimeIndex(0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#070e22] border border-cyan-800/70 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-[#050b1a] px-6 py-4 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center border border-emerald-400/40 shadow-lg">
              <GraduationCap className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200 font-mono">
                TRUNG TÂM HUẤN LUYỆN & SÁT HẠCH CHIẾN THUẬT (TRAINING CENTER)
              </h2>
              <p className="text-xs text-slate-400">Đào tạo kíp chiến đấu & Sát hạch chuyên ngành tác chiến UAV/USV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Đóng Sát Hạch
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 4 Training Modes Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['HỌC', 'LUYỆN', 'KIỂM TRA', 'HUẤN LUYỆN KÍP'] as const).map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  training.mode === m
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/60'
                    : 'bg-[#050b1a] border-cyan-950 text-slate-400 hover:text-slate-200 hover:border-cyan-800'
                }`}
              >
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Chế độ Đào tạo</div>
                <div className="text-xs font-bold text-white font-mono">{m}</div>
              </button>
            ))}
          </div>

          {/* Scenario Library Browser */}
          {!showAAR && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-300 uppercase font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Thư viện Kịch bản Huấn luyện (Scenario Library)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Chọn bài tập để bắt đầu</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TRAINING_SCENARIOS.map(sc => (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedScenarioId === sc.id
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-md'
                        : 'bg-[#050b1a] border-cyan-950 hover:border-cyan-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-200">{sc.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        sc.difficulty === 'Cơ bản' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        sc.difficulty === 'Trung bình' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        sc.difficulty === 'Nâng cao' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {sc.difficulty}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {sc.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300 bg-[#030712] p-2 rounded border border-cyan-950/60">
                      <div>Thời lượng: <strong className="text-cyan-300">{sc.duration}s</strong></div>
                      <div>Mục tiêu: <strong className="text-cyan-300">{sc.objectCount} mục tiêu</strong></div>
                      <div>Môi trường: <strong className="text-cyan-300">Sóng cấp {sc.environment.seaState}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Control Bar: START, PAUSE, RESUME, STOP, REPLAY */}
          <div className="bg-[#050b1a] border border-cyan-900/60 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <div className="text-xs font-mono text-cyan-300 font-bold">Bài tập: {currentExercise.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">Trạng thái: <span className="text-amber-400">{training.status}</span> | Chế độ: {training.mode}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {training.status === 'IDLE' || training.status === 'COMPLETED' ? (
                <button
                  onClick={handleStartTraining}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> BẮT ĐẦU (START)
                </button>
              ) : training.status === 'RUNNING' ? (
                <button
                  onClick={handlePauseTraining}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" /> TẠM DỪNG (PAUSE)
                </button>
              ) : (
                <button
                  onClick={handleResumeTraining}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> TIẾP TỤC (RESUME)
                </button>
              )}

              <button
                onClick={handleStopTraining}
                disabled={training.status === 'IDLE'}
                className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-rose-300" /> KẾT THÚC (STOP)
              </button>

              <button
                onClick={handleStartReplay}
                className="px-4 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> XEM LẠI (REPLAY)
              </button>
            </div>
          </div>

          {/* After Action Review (AAR) Panel */}
          {showAAR && (
            <div className="bg-[#050b1a] border border-emerald-700/60 p-5 rounded-xl space-y-4 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 font-mono">
                    ĐÁNH GIÁ SAU KHI KẾT THÚC (AFTER ACTION REVIEW - AAR)
                  </h3>
                </div>
                <div className="text-xl font-bold font-mono text-amber-300 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800">
                  {training.score} / 100 ĐIỂM
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono">Tiêu chí chuyên môn & Sát hạch</h4>
                  <div className="space-y-2">
                    {training.evaluations.map((ev, idx) => (
                      <div key={idx} className="bg-[#030712] border border-cyan-950 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {ev.passed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                          <span className="text-slate-200">{ev.criterion}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${ev.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                          {ev.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-[#030712] p-3.5 rounded-lg border border-cyan-950">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono">Nhận xét của Trợ lý AI</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
                    Kíp chiến đấu đã thực hiện thao tác cơ bản tương đối tốt. Thời gian phản ứng khóa mục tiêu đạt yêu cầu (&lt;15s). Tuy nhiên, cần chú ý tối ưu hóa góc bẻ lái né tránh trong điều kiện sóng cấp 4 để tránh góc mù radar.
                  </p>
                  <div className="text-[10px] text-emerald-400 font-mono pt-2 border-t border-cyan-950">
                    Trạng thái chứng nhận: ĐÃ HOÀN THÀNH HUẤN LUYỆN
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline & Replay Inspector */}
          {isReplaying && (
            <div className="bg-[#050b1a] border border-purple-800/60 p-4 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" /> Bảng Điều Khiển Xem Lại (Replay Timeline)
                </span>
                <span className="text-xs font-mono text-cyan-300">Timestamp: t = {state.replayHistory[replayTimeIndex]?.timestamp || 0}s</span>
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(0, state.replayHistory.length - 1)}
                value={replayTimeIndex}
                onChange={e => setReplayTimeIndex(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />

              <div className="bg-[#030712] p-3 rounded-lg border border-cyan-950 text-[11px] font-mono text-slate-300 space-y-1">
                <div><strong className="text-purple-300">Hành động ghi nhận:</strong> {state.replayHistory[replayTimeIndex]?.action || 'Không có sự kiện'}</div>
                <div><strong className="text-cyan-300">Trạng thái đối tượng:</strong> {state.replayHistory[replayTimeIndex]?.state.objects.length || 0} đối tượng trên màn hình</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#050b1a] px-6 py-3 border-t border-cyan-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>Hệ thống ghi nhận telemetry thời gian thực & lưu lịch sử AAR tự động</div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow transition-all"
          >
            Xác nhận & Trở về
          </button>
        </div>

      </div>
    </div>
  );
};
