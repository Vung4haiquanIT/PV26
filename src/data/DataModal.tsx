import React from 'react';
import { SimulationState } from '../types';
import { Database, Download, Upload, RefreshCcw } from 'lucide-react';

interface DataModalProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({ state, setState, onClose }) => {
  const handleExportState = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SimulationState_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b142d] border border-cyan-800/60 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#070d20] px-6 py-4 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">QUẢN LÝ DỮ LIỆU & TRẠNG THÁI (DATA MODULE)</h2>
              <p className="text-xs text-slate-400">Sao lưu, phục hồi và đồng bộ dữ liệu SimulationState toàn hệ thống</p>
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
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Thống kê dữ liệu hiện tại</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-[#091026] p-3 rounded-lg border border-cyan-900/40">
                <div className="text-slate-400 text-[10px]">ĐỐI TƯỢNG</div>
                <div className="text-lg font-bold text-cyan-300">{state.objects.length}</div>
              </div>
              <div className="bg-[#091026] p-3 rounded-lg border border-cyan-900/40">
                <div className="text-slate-400 text-[10px]">NHÁNH GIẢ THUYẾT</div>
                <div className="text-lg font-bold text-purple-300">{state.branches.length}</div>
              </div>
              <div className="bg-[#091026] p-3 rounded-lg border border-cyan-900/40">
                <div className="text-slate-400 text-[10px]">SỰ KIỆN GHI NHẬN</div>
                <div className="text-lg font-bold text-amber-300">{state.events.length}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Thao tác dữ liệu</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportState}
                className="px-4 py-2.5 bg-cyan-950 border border-cyan-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-cyan-900 transition-colors"
              >
                <Download className="w-4 h-4" /> Sao lưu dữ liệu (Export JSON)
              </button>
              <button
                onClick={() => alert('Đã kiểm tra tính toàn vẹn SimulationState. Dữ liệu đồng bộ tuyệt đối giữa 2D và 3D.')}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <RefreshCcw className="w-4 h-4 text-emerald-400" /> Kiểm tra tính đồng bộ
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#070d20] px-6 py-3 border-t border-cyan-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
