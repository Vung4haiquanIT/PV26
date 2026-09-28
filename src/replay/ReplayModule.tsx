import React from 'react';
import { SimulationState } from '../types';
import { History, Play, RotateCcw, CheckCircle } from 'lucide-react';

interface ReplayModuleProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

export const ReplayModule: React.FC<ReplayModuleProps> = ({ state, setState, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b142d] border border-cyan-800/60 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#070d20] px-6 py-4 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">NHẬT KÝ & PHÁT LẠI (AFTER ACTION REVIEW - AAR)</h2>
              <p className="text-xs text-slate-400">Xem lại diễn biến, thao tác tác chiến và phân tích kết quả sau kịch bản</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-[#050b1a] border border-cyan-950 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Tổng hợp diễn biến sự kiện</h3>
            <div className="space-y-2">
              {state.events.map((ev) => (
                <div key={ev.id} className="bg-[#091026] border border-cyan-900/40 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {Math.floor(ev.time / 60).toString().padStart(2, '0')}:{Math.floor(ev.time % 60).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{ev.title}</div>
                      <div className="text-[11px] text-slate-400">{ev.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#050b1a] border border-cyan-950 p-4 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Nhận xét của AI Cố vấn sau kịch bản</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              - Kíp chiến đấu phản ứng nhanh trong 12 giây đầu tiên khi phát hiện UAV FPV.<br/>
              - Thao tác kích hoạt gây nhiễu điện tử ở giây thứ 45 thành công, làm mất phương hướng mục tiêu.<br/>
              - Đề nghị tiếp tục rèn luyện kỹ năng xử lý tình huống phối hợp đồng thời UAV + USV tốc độ cao.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#070d20] px-6 py-3 border-t border-cyan-900/60 flex items-center justify-between">
          <button
            onClick={() => { setState(s => ({ ...s, time: 0, isPlaying: true })); onClose(); }}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow"
          >
            <Play className="w-4 h-4 fill-white" /> PHÁT LẠI TOÀN BỘ KỊCH BẢN
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
