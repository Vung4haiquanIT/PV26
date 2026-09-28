import React from 'react';
import { SimulationState } from '../types';
import { FolderGit2, Plus, Download, Upload, Trash2, Check } from 'lucide-react';

interface ScenarioModalProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ state, setState, onClose }) => {
  const scenario = state.currentScenario;

  const handleSelectScenario = (scId: string) => {
    let newName = '';
    let newDesc = '';
    let newObjects: any[] = [];
    if (scId === 'sc-01') {
      newName = 'Kịch bản đối phó bầy đàn UAV kết hợp USV cao tốc';
      newDesc = 'Tình huống giả định tàu chiến đấu mặt nước bị tấn công đồng thời bởi 1 UAV trinh sát/tự sát FPV (UAV-01) từ hướng Đông-Bắc và 1 USV mang thuốc nổ (USV-01) từ hướng Đông.';
      newObjects = [
        { id: 'uav-01', name: 'UAV-01 (FPV / Trinh sát)', type: 'UAV', position: { x: 8.5, y: 9.1 }, heading: 225, speed: 65, altitude: 800, status: 'BÁO ĐỘNG', timestamp: '10:30:15', range: 12.5, bearing: 45, rcs: 0.1, history: [{ x: 9.0, y: 9.5 }] },
        { id: 'usv-01', name: 'USV-01 (Tự sát cao tốc)', type: 'USV', position: { x: 6.8, y: 0.5 }, heading: 270, speed: 28, altitude: 0, status: 'MỤC TIÊU KHÓA', timestamp: '10:30:15', range: 6.8, bearing: 85, rcs: 2.5, history: [{ x: 7.5, y: 0.6 }] }
      ];
    } else if (scId === 'sc-02') {
      newName = 'Tấn công dồn dập từ hướng mặt trời (UAV bầy đàn)';
      newDesc = 'Bầy đàn 3 UAV FPV tấn công đồng loạt từ góc phương vị 30° và 60° với tốc độ cao, lợi dụng ánh sáng mặt trời để che khuất tầm quan sát quang điện tử.';
      newObjects = [
        { id: 'uav-sun-1', name: 'UAV-Alpha (30°)', type: 'UAV', position: { x: 5.0, y: 8.6 }, heading: 240, speed: 75, altitude: 500, status: 'BÁO ĐỘNG', timestamp: '10:30:15', range: 10.0, bearing: 30, rcs: 0.1, history: [{ x: 5.0, y: 8.6 }] },
        { id: 'uav-sun-2', name: 'UAV-Beta (60°)', type: 'UAV', position: { x: 10.4, y: 6.0 }, heading: 210, speed: 70, altitude: 600, status: 'BÁO ĐỘNG', timestamp: '10:30:15', range: 12.0, bearing: 60, rcs: 0.1, history: [{ x: 10.4, y: 6.0 }] },
        { id: 'usv-sun-3', name: 'USV-Gamma (90°)', type: 'USV', position: { x: 14.0, y: 0.0 }, heading: 270, speed: 32, altitude: 0, status: 'MỤC TIÊU KHÓA', timestamp: '10:30:15', range: 14.0, bearing: 90, rcs: 2.0, history: [{ x: 14.0, y: 0.0 }] }
      ];
    } else if (scId === 'sc-03') {
      newName = 'USV tự sát ngụy trang mục tiêu dân sự';
      newDesc = 'Mục tiêu khả nghi xuất phát từ hướng 120° ngụy trang dạng tàu cá nhưng di chuyển với quỹ đạo tấn công trực diện.';
      newObjects = [
        { id: 'usv-cam-1', name: 'Mục tiêu ngụy trang USV-03', type: 'USV', position: { x: 10.4, y: -6.0 }, heading: 330, speed: 22, altitude: 0, status: 'TUẦN TRA', timestamp: '10:30:15', range: 12.0, bearing: 120, rcs: 4.0, history: [{ x: 10.4, y: -6.0 }] }
      ];
    } else {
      newName = 'Phối hợp EW gây nhiễu & đánh chặn tầm gần';
      newDesc = 'Kịch bản huấn luyện phối hợp hệ thống tác chiến điện tử (EW) vô hiệu hóa UAV và điều khiển hỏa lực pháo CIWS tiêu diệt USV.';
      newObjects = [
        { id: 'uav-ew-1', name: 'UAV Đột kích', type: 'UAV', position: { x: -7.0, y: 7.0 }, heading: 135, speed: 60, altitude: 400, status: 'ĐANG TIẾP CẬN', timestamp: '10:30:15', range: 9.9, bearing: 315, rcs: 0.1, history: [{ x: -7.0, y: 7.0 }] },
        { id: 'usv-ew-2', name: 'USV Bọc thép', type: 'USV', position: { x: -8.0, y: -3.0 }, heading: 70, speed: 30, altitude: 0, status: 'ĐANG TIẾP CẬN', timestamp: '10:30:15', range: 8.5, bearing: 250, rcs: 3.0, history: [{ x: -8.0, y: -3.0 }] }
      ];
    }

    setState(s => ({
      ...s,
      currentScenario: {
        ...s.currentScenario,
        id: scId,
        name: newName,
        description: newDesc
      },
      objects: newObjects,
      selectedObjectId: newObjects[0]?.id || null,
      events: [
        { id: `ev-${Date.now()}`, time: Math.floor(s.time), title: `Đã tải kịch bản: ${newName}`, description: `Hệ thống đã thiết lập chiến trường thành công với ${newObjects.length} mục tiêu giả định.`, type: 'ACTION' },
        ...s.events
      ]
    }));
    onClose();
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${scenario.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b142d] border border-cyan-800/60 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#070d20] px-6 py-4 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FolderGit2 className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">QUẢN LÝ KỊCH BẢN TÁC CHIẾN</h2>
              <p className="text-xs text-slate-400">Tạo, mở, lưu, nhân bản và xuất/nhập kịch bản mô phỏng</p>
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
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Kịch bản hiện tại</div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">ID: {scenario.id}</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">{scenario.name}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-medium flex items-center gap-1 hover:bg-cyan-900"
              >
                <Download className="w-3.5 h-3.5" /> Xuất JSON Kịch bản
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Danh sách kịch bản mẫu sẵn có</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'sc-01', name: 'Đối phó bầy đàn UAV kết hợp USV cao tốc' },
                { id: 'sc-02', name: 'Tấn công dồn dập từ hướng mặt trời (UAV bầy đàn)' },
                { id: 'sc-03', name: 'USV tự sát ngụy trang mục tiêu dân sự' },
                { id: 'sc-04', name: 'Phối hợp EW gây nhiễu & đánh chặn tầm gần' }
              ].map(item => {
                const isActive = scenario.id === item.id;
                return (
                  <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between ${isActive ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : 'bg-[#050b1a] border-cyan-950 text-slate-300 hover:border-cyan-800'}`}>
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {item.id}</div>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] px-2 py-1 rounded bg-cyan-600 text-white font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Đang chạy</span>
                    ) : (
                      <button
                        onClick={() => handleSelectScenario(item.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                      >
                        Chọn
                      </button>
                    )}
                  </div>
                );
              })}
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
