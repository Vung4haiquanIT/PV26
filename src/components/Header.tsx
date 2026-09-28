import React from 'react';
import { Shield, Radar, Bot, GraduationCap, FolderGit2, Database, Settings, GitBranch } from 'lucide-react';
import { SimulationState } from '../types';

interface HeaderProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onOpenModal: (modal: 'scenario' | 'data' | 'env' | 'training' | 'replay') => void;
  currentTimeStr?: string;
  isAIOpen?: boolean;
  setIsAIOpen?: (open: boolean) => void;
  isBranchOpen?: boolean;
  setIsBranchOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  setState,
  onOpenModal,
  isAIOpen,
  setIsAIOpen,
  isBranchOpen,
  setIsBranchOpen
}) => {
  const activeCount = state.objects.filter(o => o.status !== 'ĐÃ TIÊU DIỆT').length;

  return (
    <header className="h-16 bg-[#070e22] border-b border-cyan-900/60 px-4 flex items-center justify-between select-none z-30 shadow-xl">
      {/* Logo & Title matching image */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center border border-cyan-400/40 shadow-lg shadow-cyan-950/50">
          <Shield className="w-5 h-5 text-cyan-200 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xs md:text-sm font-bold tracking-wider text-cyan-100 uppercase font-mono">
            AI TÁC NGHIỆP 2D & MÔ PHỎNG 3D ĐỐI PHÓ UAV, USV
          </h1>
          <p className="text-[11px] text-slate-400">
            Hỗ trợ tác chiến - Huấn luyện - Nghiên cứu tình huống
          </p>
        </div>
      </div>

      {/* Navigation / Control Toolbar matching image */}
      <div className="hidden xl:flex items-center space-x-1.5 bg-[#050b1a] p-1.5 rounded-lg border border-cyan-950 shadow-inner">
        <button
          onClick={() => { if (setIsBranchOpen) setIsBranchOpen(!isBranchOpen); }}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isBranchOpen ? 'bg-cyan-600 text-white shadow' : 'bg-blue-600/90 text-white hover:bg-blue-500'
          }`}
          title="Chế độ hiển thị 2D + 3D"
        >
          <GitBranch className="w-3.5 h-3.5" />
          2D + 3D
        </button>

        <button
          onClick={() => { if (setIsBranchOpen) setIsBranchOpen(!isBranchOpen); }}
          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all"
        >
          Bản đồ 2D
        </button>

        <button
          onClick={() => { if (setIsBranchOpen) setIsBranchOpen(!isBranchOpen); }}
          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all"
        >
          Mô hình 3D
        </button>

        <div className="h-4 w-[1px] bg-cyan-950 mx-1"></div>

        <button
          onClick={() => { if (setIsAIOpen) setIsAIOpen(!isAIOpen); }}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isAIOpen ? 'bg-amber-900/40 text-amber-300 border border-amber-600 shadow' : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          Cố vấn AI
        </button>

        <button
          onClick={() => { onOpenModal('training'); }}
          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all"
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          Huấn luyện
        </button>

        <button
          onClick={() => { onOpenModal('scenario'); }}
          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
          Kịch bản
        </button>

        <button
          onClick={() => { onOpenModal('data'); }}
          className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all"
        >
          <Database className="w-3.5 h-3.5 text-blue-400" />
          Dữ liệu
        </button>
      </div>

      {/* System Status & Badges matching image */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2 bg-emerald-950/80 border border-emerald-600 px-3 py-1.5 rounded-lg font-mono shadow">
          <Radar className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-xs text-emerald-300 font-bold">RADAR 360°</span>
        </div>

        <button
          onClick={() => onOpenModal('env')}
          className="flex items-center space-x-2 bg-rose-950/80 border border-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-900 transition-colors cursor-pointer shadow-md"
          title="Trạng thái mục tiêu"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-bold font-mono text-rose-200">{activeCount} MỤC TIÊU</span>
        </button>

        <button
          onClick={() => onOpenModal('env')}
          className="p-2 rounded-lg bg-[#050b1a] border border-cyan-900/60 text-cyan-300 hover:text-white hover:bg-cyan-950 transition-colors shadow"
          title="Cài đặt hệ thống / Môi trường"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
