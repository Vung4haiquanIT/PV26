import React, { useState, useEffect } from 'react';
import { SimulationState } from './types';
import { createInitialSimulationState } from './scenario/initialScenario';
import { Header } from './components/Header';
import { TimelineControl } from './components/TimelineControl';
import { Tactical2D } from './tactical2d/Tactical2D';
import { Simulation3D } from './simulation3d/Simulation3D';
import { AIAnalysisPanel } from './ai/AIAnalysisPanel';
import { TrainingModule } from './training/TrainingModule';
import { ReplayModule } from './replay/ReplayModule';
import { ScenarioModal } from './scenario/ScenarioModal';
import { DataModal } from './data/DataModal';
import { EnvironmentModal } from './components/EnvironmentModal';
import { Bot, GitBranch, X, Cpu } from 'lucide-react';
import { tick } from './simulation/SimulationEngine';

export default function App() {
  const [state, setState] = useState<SimulationState>(createInitialSimulationState());
  const [modalOpen, setModalOpen] = useState<'scenario' | 'data' | 'env' | 'training' | 'replay' | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(true);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('10:30:15 UTC');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const utc = now.toUTCString().split(' ')[4] + ' UTC';
      setCurrentTimeStr(utc);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulation Engine Loop using independent SimulationEngine.tick()
  useEffect(() => {
    if (!state.isPlaying) return;

    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.isPlaying) return prev;
        return tick(prev, 0.5);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [state.isPlaying, state.speed]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#040814] text-slate-100 overflow-hidden font-sans select-none">
      {/* Professional Tactical Simulation Header */}
      <Header
        state={state}
        setState={setState}
        onOpenModal={m => setModalOpen(m)}
        currentTimeStr={currentTimeStr}
        isAIOpen={isAIOpen}
        setIsAIOpen={setIsAIOpen}
        isBranchOpen={isBranchOpen}
        setIsBranchOpen={setIsBranchOpen}
      />

      {/* Sub-Header Status Bar */}
      <div className="bg-[#060b1c] border-b border-cyan-950 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-cyan-300 z-20 shadow-inner">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LINK-16 SECURE: KẾT NỐI ỔN ĐỊNH
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">CẤP ĐỘ CẢNH BÁO: <strong className="text-amber-400">DEFCON 2</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">NHÁNH KỊCH BẢN: <strong className="text-purple-300">{state.currentScenario.name}</strong></span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-cyan-400" /> CPU: 14%</span>
          <span>LATENCY: 12ms</span>
          <span className="text-cyan-200 font-bold">{currentTimeStr}</span>
        </div>
      </div>

      {/* Main Layout (Tactical 2D ~48% | 3D ~52%) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-2 p-2 overflow-hidden bg-[#050916]">
        {/* Left Region: 2D Tactical PPI Board (cols 6 = ~48-50%) */}
        <div className="xl:col-span-6 h-full flex flex-col min-h-[350px] relative bg-[#070e22] rounded-lg border border-cyan-900/50 shadow-xl overflow-hidden">
          <Tactical2D state={state} setState={setState} />
        </div>

        {/* Right Region: 3D Simulation Viewport (cols 6 = ~50-52%) */}
        <div className="xl:col-span-6 h-full flex flex-col min-h-[350px] relative bg-[#070e22] rounded-lg border border-cyan-900/50 shadow-xl overflow-hidden">
          <Simulation3D state={state} setState={setState} />
        </div>
      </div>

      {/* Collapsible AI Analysis Drawer / Panel Overlay */}
      {isAIOpen && (
        <div className="fixed right-2 top-20 bottom-16 w-[440px] z-40 bg-[#070e22]/95 backdrop-blur-md border border-cyan-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="bg-[#050b1a] px-4 py-3 border-b border-cyan-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200">CỐ VẤN AI TÁC CHIẾN CHUYÊN SÂU</h3>
                <p className="text-[10px] text-slate-400">Phân tích đa luồng, đề xuất phương án đối phó UAV/USV</p>
              </div>
            </div>
            <button
              onClick={() => setIsAIOpen(false)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AIAnalysisPanel state={state} setState={setState} />
          </div>
        </div>
      )}

      {/* Scenario Branch Panel Overlay */}
      {isBranchOpen && (
        <div className="fixed left-2 top-20 bottom-16 w-[400px] z-40 bg-[#070e22]/95 backdrop-blur-md border border-purple-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
          <div className="bg-[#050b1a] px-4 py-3 border-b border-purple-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">NHÁNH GIẢ THUYẾT (SCENARIO BRANCHES)</h3>
                <p className="text-[10px] text-slate-400">Mô phỏng song song các kịch bản đối phó chiến thuật</p>
              </div>
            </div>
            <button
              onClick={() => setIsBranchOpen(false)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-[11px] text-slate-300">Chọn nhánh tác chiến để so sánh phương án:</div>
            {state.branches.map(b => (
              <div
                key={b.id}
                onClick={() => setState(s => ({ ...s, activeBranchId: b.id }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  state.activeBranchId === b.id
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md'
                    : 'bg-[#050b1a] border-cyan-950 text-slate-300 hover:border-purple-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{b.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300">{b.expectedStatus}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{b.description}</p>
                <div className="text-[10px] text-cyan-400 font-mono mt-1">Điều kiện: {b.condition} ({b.simulationTime}s)</div>
              </div>
            ))}
            <button
              onClick={() => {
                const newId = `branch-${Date.now().toString().slice(-4)}`;
                const branchNumber = state.branches.length + 1;
                const newBranch = {
                  id: newId,
                  name: `Nhánh Giả Thuyết #${branchNumber} (Cơ động né tránh)`,
                  description: `Phương án tác chiến giả định #${branchNumber} tự động phân bổ quỹ đạo bẻ lái cách ly mục tiêu.`,
                  condition: `Kích hoạt t=${Math.floor(state.time)}s`,
                  simulationTime: Math.floor(state.time),
                  expectedStatus: 'An toàn tối ưu',
                  objects: state.objects,
                  isActive: false
                };
                setState(s => ({
                  ...s,
                  branches: [...s.branches, newBranch],
                  activeBranchId: newId,
                  events: [
                    {
                      id: `ev-${Date.now()}`,
                      time: Math.floor(s.time),
                      title: `Tạo nhánh mô phỏng mới: Nhánh #${branchNumber}`,
                      description: `AI Solver đã khởi tạo nhánh giả thuyết song song #${branchNumber} với tham số né tránh tự động.`,
                      type: 'ACTION'
                    },
                    ...s.events
                  ]
                }));
              }}
              className="w-full py-2.5 bg-purple-950 border border-purple-700 text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-900 transition-colors flex items-center justify-center gap-2 shadow"
            >
              <GitBranch className="w-4 h-4" /> Tạo nhánh mô phỏng mới
            </button>
          </div>
        </div>
      )}

      {/* Bottom Region: Timeline & Playback Control */}
      <TimelineControl state={state} setState={setState} onOpenReplay={() => setModalOpen('replay')} />

      {/* Modals */}
      {modalOpen === 'scenario' && <ScenarioModal state={state} setState={setState} onClose={() => setModalOpen(null)} />}
      {modalOpen === 'data' && <DataModal state={state} setState={setState} onClose={() => setModalOpen(null)} />}
      {modalOpen === 'env' && <EnvironmentModal state={state} setState={setState} onClose={() => setModalOpen(null)} />}
      {modalOpen === 'training' && <TrainingModule state={state} setState={setState} onClose={() => setModalOpen(null)} />}
      {modalOpen === 'replay' && <ReplayModule state={state} setState={setState} onClose={() => setModalOpen(null)} />}
    </div>
  );
}
