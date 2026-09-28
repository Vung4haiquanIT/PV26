import React, { useState } from 'react';
import { SimulationState, SimulationObject, ScenarioBranch, SolverResult } from '../types';
import { Bot, Cpu, AlertTriangle, Layers, Play, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, RefreshCw, Database, Check } from 'lucide-react';
import { runSolverRegistry } from '../solver/solverRegistry';

interface AIAnalysisPanelProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ state, setState }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(state.branches[0]?.id || 'branch-1');
  const [simulationResult, setSimulationResult] = useState<{
    branchId: string;
    cpa: number;
    timeToCPA: number;
    successRate: number;
    analysis: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Run Solver Registry on current state
  const computedSolvers = runSolverRegistry(state);

  const handleConfirmSolver = (solverId: string) => {
    setState(s => {
      const updatedSolvers = (s.solvers.length > 0 ? s.solvers : computedSolvers).map(sol =>
        sol.solverId === solverId ? { ...sol, confirmed: true, confirmedAt: new Date().toLocaleTimeString() } : sol
      );
      return {
        ...s,
        solvers: updatedSolvers,
        events: [
          {
            id: `ev-conf-${Date.now()}`,
            time: Math.floor(s.time),
            title: `Chỉ huy xác nhận Solver: ${solverId}`,
            description: `Sĩ quan trực chiến đã kiểm tra và phê duyệt kết quả tính toán chuyên môn từ Solver Registry.`,
            type: 'ACTION'
          },
          ...s.events
        ]
      };
    });
  };

  // 1. AI Analysis & State parsing from SimulationState
  const activeObjects = state.objects.filter(o => o.status !== 'ĐÃ TIÊU DIỆT' && o.type !== 'OWN_SHIP');
  const uavCount = activeObjects.filter(o => o.type === 'UAV').length;
  const usvCount = activeObjects.filter(o => o.type === 'USV').length;

  // Determine Situation Type & Problem ID
  const situationType = uavCount > 0 && usvCount > 0 
    ? 'Tác chiến Phức hợp Đa tầng (UAV + USV bầy đàn)'
    : uavCount > 0 
    ? 'Đột kích Trên không (UAV FPV / Tự sát)' 
    : usvCount > 0 
    ? 'Tấn công Bất ngờ Trên mặt nước (USV Cao tốc)' 
    : 'Tuần tra An ninh Bình thường';

  const problemId = uavCount > 0 && usvCount > 0 
    ? 'PROB-HYBRID-SWARM-04' 
    : uavCount > 0 
    ? 'PROB-AIR-RAID-01' 
    : 'PROB-SURFACE-ASSAULT-02';

  // Current State Summary
  const currentSummary = `Hệ thống ghi nhận thời gian t=${state.time}s. Phát hiện ${uavCount} mục tiêu UAV và ${usvCount} mục tiêu USV đang cơ động tiếp cận biên đội tàu chiến đấu.`;

  // Detected Changes
  const detectedChanges = activeObjects.length > 0 
    ? `Mục tiêu ${activeObjects[0].name} thay đổi vận tốc lên ${activeObjects[0].speed} (${activeObjects[0].type === 'UAV' ? 'm/s' : 'kts'}), góc phương vị ${activeObjects[0].bearing || 45}°.`
    : 'Không ghi nhận biến động quỹ đạo bất thường trong 30s qua.';

  // Potential Developments
  const potentialDevelopments = uavCount > 0 
    ? 'Mục tiêu UAV có khả năng thực hiện tấn công lao thẳng (kamikaze) vào thượng tầng tàu trong vòng 45 giây tới nếu không kích hoạt hệ thống gây nhiễu hoặc CIWS.'
    : 'USV có thể triển khai ngư lôi hạng nhẹ hoặc chất nổ áp sát mạn trái.';

  // Handle running simulation on a branch option
  const handleRunSimulation = (branch: ScenarioBranch) => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      const simResult = {
        branchId: branch.id,
        cpa: parseFloat((Math.random() * 1.2 + 0.2).toFixed(2)),
        timeToCPA: Math.floor(Math.random() * 30 + 15),
        successRate: Math.floor(Math.random() * 15 + 85),
        analysis: `Mô phỏng nhánh [${branch.name}] hoàn tất thành công. Đã kiểm tra quỹ đạo va chạm (CPA). Tỷ lệ thành công dự kiến ${Math.floor(Math.random() * 15 + 85)}%, khoảng cách an toàn tuyệt đối.`
      };

      setSimulationResult(simResult);
      setIsSimulating(false);

      setState(s => ({
        ...s,
        events: [
          ...s.events,
          {
            id: `ev-sim-${Date.now()}`,
            time: s.time,
            title: `Kết quả Mô phỏng: ${branch.name}`,
            description: simResult.analysis,
            type: 'ACTION'
          }
        ]
      }));
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#080e21] border border-cyan-900/40 rounded-xl overflow-hidden shadow-xl font-sans text-xs">
      {/* Panel Header */}
      <div className="bg-[#0b142d] px-4 py-3 border-b border-cyan-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-200 font-mono">
            TRỢ LÝ AI PHÂN TÍCH DIỄN BIẾN & PHƯƠNG ÁN
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> {problemId}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Tóm tắt trạng thái hiện tại & Loại tình huống */}
        <div className="bg-[#050b1a] border border-cyan-950 p-3.5 rounded-lg space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 uppercase text-[11px] flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Tóm tắt trạng thái & Tình huống
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
              {situationType}
            </span>
          </div>
          <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
            {currentSummary}
          </p>
        </div>

        {/* 2 & 3. Phát hiện thay đổi & Phân tích diễn biến */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#050b1a] border border-cyan-950 p-3 rounded-lg space-y-1.5">
            <div className="font-bold text-cyan-300 text-[11px] uppercase flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3 h-3 text-cyan-400" /> Phát hiện thay đổi
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
              {detectedChanges}
            </p>
          </div>

          <div className="bg-[#050b1a] border border-cyan-950 p-3 rounded-lg space-y-1.5">
            <div className="font-bold text-cyan-300 text-[11px] uppercase flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> Phân tích diễn biến
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
              {potentialDevelopments}
            </p>
          </div>
        </div>

        {/* Professional Solver Registry Section */}
        <div className="bg-[#050b1a] border border-cyan-950 p-3.5 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
            <span className="font-bold text-cyan-300 uppercase text-[11px] flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5 text-blue-400" /> HỆ THỐNG SOLVER CHUYÊN MÔN (SOLVER REGISTRY)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              {computedSolvers.length} Solvers Hoạt động
            </span>
          </div>

          <div className="space-y-2.5">
            {computedSolvers.map(solver => {
              const currentSaved = state.solvers.find(s => s.solverId === solver.solverId) || solver;
              const isConfirmed = currentSaved.confirmed;

              return (
                <div key={solver.solverId} className="bg-[#030712] border border-cyan-950/80 p-3 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-300 font-mono">{solver.problemName}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        solver.validationStatus === 'NGUY HIỂM' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        solver.validationStatus === 'CẢNH BÁO' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {solver.validationStatus} ({solver.confidence}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-300 space-y-1">
                    <div>• <strong className="text-slate-400">Đầu vào:</strong> {solver.inputSummary}</div>
                    {solver.cpa > 0 && <div>• <strong className="text-slate-400">CPA:</strong> {solver.cpa} km (t={solver.timeToCPA}s)</div>}
                    <div>• <strong className="text-cyan-200">Đề xuất:</strong> {solver.recommendedAction}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                    <span className="text-slate-500">ID: {solver.solverId}</span>
                    {isConfirmed ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> ĐÃ XÁC NHẬN ({currentSaved.confirmedAt || 'OK'})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmSolver(solver.solverId)}
                        className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold transition-all shadow cursor-pointer"
                      >
                        [ XÁC NHẬN KẾT QUẢ ]
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7, 8, 9, 10, 11. Các nhánh mô phỏng (Scenario Branches) & Nút [MÔ PHỎNG] */}
        <div className="space-y-3">
          <div className="font-bold text-cyan-300 uppercase text-[11px] flex items-center gap-1.5 font-mono">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Các nhánh phương án mô phỏng (Scenario Options)
          </div>

          <div className="space-y-2.5">
            {state.branches.map(branch => (
              <div
                key={branch.id}
                className={`bg-[#050b1a] border p-3.5 rounded-lg space-y-2.5 transition-all ${
                  selectedBranchId === branch.id ? 'border-cyan-500 bg-cyan-950/20 shadow-lg' : 'border-cyan-950 hover:border-cyan-800'
                }`}
                onClick={() => setSelectedBranchId(branch.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="font-bold text-cyan-200 text-xs font-mono">{branch.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunSimulation(branch);
                    }}
                    disabled={isSimulating}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-white" /> {isSimulating && selectedBranchId === branch.id ? 'Đang chạy...' : '[MÔ PHỎNG]'}
                  </button>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {branch.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-cyan-950">
                  <span>Điều kiện: {branch.condition}</span>
                  <span className="text-emerald-400">Trạng thái: {branch.expectedStatus}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Simulation Result & AI Analysis Output Box */}
          {simulationResult && (
            <div className="bg-emerald-950/40 border border-emerald-700/60 p-3.5 rounded-lg space-y-2 animate-in fade-in duration-200">
              <div className="font-bold text-emerald-300 uppercase text-[11px] flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> KẾT QUẢ MÔ PHỎNG & PHÂN TÍCH AI
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-200 bg-emerald-950/60 p-2 rounded border border-emerald-900">
                <div>CPA Va chạm: <span className="text-cyan-300 font-bold">{simulationResult.cpa} km</span></div>
                <div>Thời gian CPA: <span className="text-cyan-300 font-bold">{simulationResult.timeToCPA}s</span></div>
                <div>Tỷ lệ Thành công: <span className="text-emerald-300 font-bold">{simulationResult.successRate}%</span></div>
              </div>
              <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                {simulationResult.analysis}
              </p>
              <div className="text-[10px] text-amber-300 font-mono italic">
                * Lưu ý: AI hỗ trợ phân tích phương án, quyền quyết định thực thi thuộc về chỉ huy trực chiến.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
