import React from 'react';
import { SimulationState } from '../types';
import { Sun, Wind, CloudRain, Eye } from 'lucide-react';

interface EnvironmentModalProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({ state, setState, onClose }) => {
  const env = state.environment;

  const handleChange = (field: string, value: any) => {
    setState(s => ({
      ...s,
      environment: { ...s.environment, [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b142d] border border-cyan-800/60 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#070d20] px-6 py-4 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sun className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">MÔ PHỎNG MÔI TRƯỜNG & THỜI TIẾT</h2>
              <p className="text-xs text-slate-400">Cấu hình điều kiện khí tượng, trạng thái biển phục vụ mô phỏng tác chiến</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 font-bold uppercase text-[11px]">Thời tiết</label>
            <select
              value={env.weather}
              onChange={e => handleChange('weather', e.target.value)}
              className="w-full bg-[#050b1a] border border-cyan-900/60 rounded p-2 text-white font-mono"
            >
              <option value="Tốt">Tốt (Trời quang, mây ít)</option>
              <option value="Mưa nhẹ">Mưa nhẹ</option>
              <option value="Sương mù">Sương mù (Giảm tầm nhìn)</option>
              <option value="Gió bão">Gió bão (Biển động mạnh)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold uppercase text-[11px]">Trạng thái sóng biển (Cấp sóng)</label>
            <select
              value={env.seaState}
              onChange={e => handleChange('seaState', parseInt(e.target.value))}
              className="w-full bg-[#050b1a] border border-cyan-900/60 rounded p-2 text-white font-mono"
            >
              <option value={1}>Cấp 1 (Lặng sóng)</option>
              <option value={2}>Cấp 2 (Sóng nhỏ - 0.5m)</option>
              <option value={3}>Cấp 3 (Sóng vừa - 1.25m)</option>
              <option value={4}>Cấp 4 (Động - 2.5m)</option>
              <option value={5}>Cấp 5 (Động mạnh - 4.0m)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold uppercase text-[11px]">Tốc độ gió (Knots): {env.windSpeed} kts</label>
            <input
              type="range"
              min={0}
              max={50}
              value={env.windSpeed}
              onChange={e => handleChange('windSpeed', parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold uppercase text-[11px]">Tầm nhìn xa (km): {env.visibility} km</label>
            <input
              type="range"
              min={1}
              max={40}
              value={env.visibility}
              onChange={e => handleChange('visibility', parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#070d20] px-6 py-3 border-t border-cyan-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow"
          >
            Lưu & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
