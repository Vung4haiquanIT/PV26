import React, { useState, useRef } from 'react';
import { SimulationObject, SimulationState } from '../types';
import { Plus, Trash2, Eye, ShieldAlert, Crosshair, Navigation, Maximize2, Edit3, Check } from 'lucide-react';
import { calculateRequiredDuration } from '../simulation/SimulationEngine';

interface Tactical2DProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
}

export const Tactical2D: React.FC<Tactical2DProps> = ({ state, setState }) => {
  const [showHistory, setShowHistory] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedObjId, setSelectedObjId] = useState<string | null>(state.selectedObjectId);
  const [isEditing, setIsEditing] = useState(false);

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advType, setAdvType] = useState<'UAV' | 'USV' | 'TARGET'>('UAV');
  const [advName, setAdvName] = useState('UAV-FPV-Attack');
  const [advBearing, setAdvBearing] = useState(45);
  const [advRange, setAdvRange] = useState(15);
  const [advSpeed, setAdvSpeed] = useState(50);
  const [advAltitude, setAdvAltitude] = useState(300);

  const openAdvancedForType = (type: 'UAV' | 'USV' | 'TARGET') => {
    const idx = state.objects.length + 1;
    setAdvType(type);
    setAdvName(type === 'UAV' ? `UAV-Attack-${idx}` : type === 'USV' ? `USV-Boat-${idx}` : `Target-${idx}`);
    setAdvBearing(type === 'UAV' ? 30 : type === 'USV' ? 120 : 45);
    setAdvRange(15);
    setAdvSpeed(type === 'UAV' ? 60 : 35);
    setAdvAltitude(type === 'UAV' ? 400 : 0);
    setShowAdvancedModal(true);
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const radAngle = (advBearing * Math.PI) / 180;
    const x = parseFloat((advRange * Math.sin(radAngle)).toFixed(1));
    const y = parseFloat((advRange * Math.cos(radAngle)).toFixed(1));
    const newId = `${advType.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const angleToShip = Math.atan2(0 - x, 0 - y) * (180 / Math.PI);
    const heading = Math.round((angleToShip + 360) % 360);

    const newObj: SimulationObject = {
      id: newId,
      name: advName,
      type: advType,
      position: { x, y },
      initialPosition: { x, y },
      initialAltitude: advType === 'UAV' ? advAltitude : 0,
      heading,
      speed: advSpeed,
      altitude: advType === 'UAV' ? advAltitude : 0,
      status: 'ĐANG TIẾP CẬN',
      timestamp: '10:30:15',
      range: advRange,
      bearing: advBearing,
      rcs: advType === 'UAV' ? 0.1 : 2.0,
      history: [{ x, y }]
    };

    setState(s => {
      const newObjects = [...s.objects, newObj];
      const requiredDuration = calculateRequiredDuration(newObjects);
      return {
        ...s,
        duration: requiredDuration,
        objects: newObjects,
        selectedObjectId: newId
      };
    });
    setSelectedObjId(newId);
    setShowAdvancedModal(false);
  };

  const svgRef = useRef<SVGSVGElement>(null);

  const selectedObject = state.objects.find(o => o.id === (selectedObjId || state.selectedObjectId));

  // Radar range in km
  const radarRange = state.radarRange;

  // Convert relative km coordinates to SVG coordinates (center at 300, 300)
  const size = 600;
  const center = size / 2;
  const scale = (center - 50) / radarRange; // pixels per km

  const toSvgCoords = (x: number, y: number) => {
    return {
      cx: center + x * scale * zoom + pan.x,
      cy: center - y * scale * zoom + pan.y
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(3, z * delta)));
  };

  const handleAddObject = (type: 'UAV' | 'USV' | 'WAYPOINT' | 'TARGET') => {
    const idx = state.objects.length + 1;
    const angleDeg = (idx * 45) % 360;
    const rad = (angleDeg * Math.PI) / 180;
    const dist = radarRange * (type === 'WAYPOINT' ? 0.8 : 0.5);
    const x = parseFloat((dist * Math.sin(rad)).toFixed(1));
    const y = parseFloat((dist * Math.cos(rad)).toFixed(1));
    const newId = `${type.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newObj: SimulationObject = {
      id: newId,
      name: type === 'WAYPOINT' ? `WP-${idx}` : `${type === 'UAV' ? 'UAV-FPV' : type === 'USV' ? 'USV-CaoTốc' : 'Mục tiêu'} #${idx}`,
      type: type,
      position: { x, y },
      initialPosition: { x, y },
      initialAltitude: type === 'UAV' ? 500 : 0,
      heading: (angleDeg + 180) % 360,
      speed: type === 'UAV' ? 60 : type === 'USV' ? 30 : type === 'WAYPOINT' ? 0 : 15,
      altitude: type === 'UAV' ? 500 : 0,
      status: type === 'WAYPOINT' ? 'TUẦN TRA' : 'BÁO ĐỘNG',
      timestamp: '10:30:15',
      range: parseFloat(dist.toFixed(1)),
      bearing: angleDeg,
      rcs: type === 'UAV' ? 0.1 : 2.0,
      history: [{ x, y }]
    };

    setState(s => {
      const newObjects = [...s.objects, newObj];
      const requiredDuration = calculateRequiredDuration(newObjects);
      return {
        ...s,
        duration: requiredDuration,
        objects: newObjects,
        selectedObjectId: newId
      };
    });
    setSelectedObjId(newId);
  };

  const handleDeleteSelected = () => {
    const targetId = selectedObjId || state.selectedObjectId;
    if (!targetId || targetId === 'own-ship') return;
    setState(s => {
      const newObjects = s.objects.filter(o => o.id !== targetId);
      const requiredDuration = calculateRequiredDuration(newObjects);
      return {
        ...s,
        duration: requiredDuration,
        objects: newObjects,
        selectedObjectId: null
      };
    });
    setSelectedObjId(null);
  };

  const handleDeleteAllTargets = () => {
    setState(s => {
      const newObjects = s.objects.filter(o => o.type === 'OWN_SHIP');
      return {
        ...s,
        objects: newObjects,
        selectedObjectId: null,
        duration: 600,
        time: 0,
        isPlaying: false
      };
    });
    setSelectedObjId(null);
  };

  const handleUpdateSelected = (field: string, value: any) => {
    const targetId = selectedObjId || state.selectedObjectId;
    if (!targetId) return;
    setState(s => ({
      ...s,
      objects: s.objects.map(o => {
        if (o.id === targetId) {
          return { ...o, [field]: value };
        }
        return o;
      })
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#070e22] rounded-lg overflow-hidden border border-cyan-900/50 shadow-2xl">
      {/* Panel Header matching image */}
      <div className="bg-[#050b1a] px-4 py-3 border-b border-cyan-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-mono">RADAR TÁC NGHIỆP PPI</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/80 text-cyan-300 font-mono font-bold">TẦM 80KM</span>
          <div className="flex items-center space-x-1.5 text-xs">
            <button className="px-2 py-0.5 rounded bg-[#030712] border border-cyan-950 text-cyan-300 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> ĐIỂM ĐÓN
            </button>
            <button className="px-2 py-0.5 rounded bg-[#030712] border border-cyan-950 text-cyan-300 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> CUNG BẮN
            </button>
            <div className="flex bg-[#030712] rounded border border-cyan-950">
              {['4K', '8K', '12K'].map(k => (
                <button key={k} className="px-2 py-0.5 text-[10px] font-mono text-cyan-300 hover:bg-cyan-900/40">{k}</button>
              ))}
            </div>
            <button
              onClick={() => openAdvancedForType('TARGET')}
              className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-200 text-[10px] font-bold hover:bg-cyan-900"
            >
              + MỤC TIÊU
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar / Actions */}
      <div className="bg-[#060b1c] px-4 py-2 border-b border-cyan-950 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openAdvancedForType('UAV')}
            className="px-2.5 py-1.5 rounded bg-cyan-950 border border-cyan-700/80 text-cyan-300 font-semibold flex items-center gap-1.5 hover:bg-cyan-900 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> Thêm UAV
          </button>
          <button
            onClick={() => openAdvancedForType('USV')}
            className="px-2.5 py-1.5 rounded bg-amber-950/60 border border-amber-700/80 text-amber-300 font-semibold flex items-center gap-1.5 hover:bg-amber-900/60 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Thêm USV
          </button>
          <button
            onClick={() => handleAddObject('WAYPOINT')}
            className="px-2.5 py-1.5 rounded bg-purple-950/60 border border-purple-700/80 text-purple-300 font-semibold flex items-center gap-1.5 hover:bg-purple-900/60 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" /> Thêm Waypoint
          </button>
          <button
            onClick={() => openAdvancedForType('TARGET')}
            className="px-2.5 py-1.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition-colors shadow-sm"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" /> Tạo Mục Tiêu Nâng Cao
          </button>
          <button
            onClick={handleDeleteAllTargets}
            className="px-2.5 py-1.5 rounded bg-rose-950/80 border border-rose-700/80 text-rose-300 font-semibold flex items-center gap-1.5 hover:bg-rose-900 transition-colors shadow-sm"
            title="Xóa tất cả mục tiêu"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Xóa tất cả
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 border transition-colors ${showHistory ? 'bg-cyan-950 border-cyan-600 text-cyan-300 shadow' : 'bg-[#030712] border-slate-800 text-slate-400'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Quỹ đạo
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-2.5 py-1.5 rounded bg-[#030712] border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            title="Reset Zoom & Pan"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* SVG PPI Radar Board Canvas */}
      <div
        className="flex-1 relative overflow-hidden bg-[#030712] flex items-center justify-center cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full max-w-[620px] max-h-[620px]"
        >
          {/* Radar background */}
          <circle cx={center + pan.x} cy={center + pan.y} r={(center - 40) * zoom} fill="#02050f" stroke="#0e3a5f" strokeWidth="2.5" />

          {/* Range rings (Vòng cự ly) */}
          {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const r = (center - 40) * zoom * ratio;
            const kmVal = Math.round(radarRange * ratio);
            return (
              <g key={idx}>
                <circle
                  cx={center + pan.x}
                  cy={center + pan.y}
                  r={r}
                  fill="none"
                  stroke="#0e4475"
                  strokeWidth="1"
                  strokeDasharray={idx < 3 ? "4,4" : undefined}
                />
                <text
                  x={center + pan.x + 6}
                  y={center + pan.y - r + 14}
                  fill="#00e5ff"
                  fontSize="10"
                  fontFamily="monospace"
                  opacity="0.8"
                >
                  {kmVal}km
                </text>
              </g>
            );
          })}

          {/* Bearing lines every 30 degrees + North Indicator (Hướng Bắc) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30 * (Math.PI / 180);
            const outerR = (center - 40) * zoom;
            const x2 = center + pan.x + Math.sin(angle) * outerR;
            const y2 = center + pan.y - Math.cos(angle) * outerR;
            const textX = center + pan.x + Math.sin(angle) * (outerR + 18);
            const textY = center + pan.y - Math.cos(angle) * (outerR + 18);
            const degStr = i === 0 ? '000° (N)' : `${(i * 30).toString().padStart(3, '0')}°`;

            return (
              <g key={i}>
                <line
                  x1={center + pan.x}
                  y1={center + pan.y}
                  x2={x2}
                  y2={y2}
                  stroke="#0e3a5f"
                  strokeWidth={i === 0 ? "1.5" : "0.8"}
                  strokeDasharray={i % 3 === 0 ? undefined : "2,2"}
                />
                <text
                  x={textX}
                  y={textY}
                  fill={i === 0 ? "#00e5ff" : "#64748b"}
                  fontSize={i === 0 ? "11" : "9"}
                  fontFamily="monospace"
                  fontWeight={i === 0 ? "bold" : "normal"}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {degStr}
                </text>
              </g>
            );
          })}

          {/* Sector sweep radar animation effect */}
          <path
            d={`M ${center + pan.x} ${center + pan.y} L ${center + pan.x} ${center + pan.y - (center - 40) * zoom} A ${(center - 40) * zoom} ${(center - 40) * zoom} 0 0 1 ${center + pan.x + (center - 40) * zoom * 0.7} ${center + pan.y - (center - 40) * zoom * 0.7} Z`}
            fill="url(#radarSweepGradient)"
            opacity="0.3"
            className="animate-spin origin-center"
            style={{ animationDuration: '6s', transformOrigin: `${center + pan.x}px ${center + pan.y}px` }}
          />

          <defs>
            <radialGradient id="radarSweepGradient" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* History trails (Đường quỹ đạo & lịch sử) */}
          {showHistory && state.objects.map(obj => {
            if (!obj.history || obj.history.length < 2) return null;
            const coords = obj.history.map(pt => toSvgCoords(pt.x, pt.y));
            const pathData = coords.reduce((acc, pt, idx) => idx === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`, '');
            const strokeColor = obj.type === 'UAV' ? '#ef4444' : obj.type === 'USV' ? '#f59e0b' : obj.type === 'WAYPOINT' ? '#a855f7' : '#38bdf8';
            return (
              <path
                key={`hist-${obj.id}`}
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.6"
              />
            );
          })}

          {/* Waypoints lines connecting */}
          {state.objects.filter(o => o.type === 'WAYPOINT').map((wp, idx, arr) => {
            if (idx === 0) return null;
            const prev = arr[idx - 1];
            const p1 = toSvgCoords(prev.position.x, prev.position.y);
            const p2 = toSvgCoords(wp.position.x, wp.position.y);
            return (
              <line
                key={`wp-line-${wp.id}`}
                x1={p1.cx}
                y1={p1.cy}
                x2={p2.cx}
                y2={p2.cy}
                stroke="#c084fc"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.7"
              />
            );
          })}

          {/* Objects rendering (Tâm tàu, UAV, USV, Waypoints, Target) */}
          {state.objects.map(obj => {
            const { cx, cy } = toSvgCoords(obj.position.x, obj.position.y);
            const isSelected = obj.id === (selectedObjId || state.selectedObjectId);

            if (obj.type === 'OWN_SHIP') {
              return (
                <g
                  key={obj.id}
                  onClick={() => { setSelectedObjId(obj.id); setState(s => ({ ...s, selectedObjectId: obj.id })); }}
                  className="cursor-pointer"
                >
                  {isSelected && <circle cx={cx} cy={cy} r="22" fill="none" stroke="#00e5ff" strokeWidth="2" className="animate-ping" />}
                  {/* Own ship symbol - blue triangle pointing North */}
                  <polygon
                    points={`${cx},${cy - 14} ${cx - 8},${cy + 12} ${cx + 8},${cy + 12}`}
                    fill="#00e5ff"
                    stroke="#ffffff"
                    strokeWidth="2"
                    transform={`rotate(${obj.heading}, ${cx}, ${cy})`}
                  />
                  <text x={cx + 16} y={cy + 4} fill="#00e5ff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {obj.name} (Tâm tàu)
                  </text>
                </g>
              );
            }

            if (obj.type === 'WAYPOINT') {
              return (
                <g
                  key={obj.id}
                  onClick={() => { setSelectedObjId(obj.id); setState(s => ({ ...s, selectedObjectId: obj.id })); }}
                  className="cursor-pointer"
                >
                  {isSelected && <circle cx={cx} cy={cy} r="16" fill="none" stroke="#c084fc" strokeWidth="2" className="animate-pulse" />}
                  <polygon points={`${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}`} fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
                  <text x={cx + 12} y={cy + 3} fill="#d8b4fe" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {obj.name}
                  </text>
                </g>
              );
            }

            const color = obj.type === 'UAV' ? '#ef4444' : obj.type === 'USV' ? '#f59e0b' : '#10b981';

            return (
              <g
                key={obj.id}
                onClick={() => { setSelectedObjId(obj.id); setState(s => ({ ...s, selectedObjectId: obj.id })); }}
                className="cursor-pointer"
              >
                {isSelected && <circle cx={cx} cy={cy} r="18" fill="none" stroke={color} strokeWidth="2" className="animate-pulse" />}
                
                {/* Symbol shape based on type */}
                {obj.type === 'UAV' ? (
                  <path
                    d={`M ${cx} ${cy - 8} L ${cx + 8} ${cy + 6} L ${cx} ${cy + 2} L ${cx - 8} ${cy + 6} Z`}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    transform={`rotate(${obj.heading}, ${cx}, ${cy})`}
                  />
                ) : (
                  <rect
                    x={cx - 6}
                    y={cx ? cy - 6 : cy - 6}
                    width="12"
                    height="12"
                    rx="2"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    transform={`rotate(${obj.heading}, ${cx}, ${cy})`}
                  />
                )}

                {/* Data labels (Label dữ liệu chi tiết trên radar) */}
                <text x={cx + 12} y={cy - 4} fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {obj.id.toUpperCase()} ({obj.speed} {obj.type === 'UAV' ? 'm/s' : 'kts'})
                </text>
                <text x={cx + 12} y={cy + 8} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  H: {obj.heading}° | R: {obj.range || '5.0'}km
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay matching image */}
        <div className="absolute top-3 left-3 bg-[#030712]/95 border border-cyan-900/60 p-2.5 rounded-lg text-[11px] font-mono space-y-1.5 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-300"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span> Tàu của ta</div>
          <div className="flex items-center gap-2 text-rose-400"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> UAV / FPV</div>
          <div className="flex items-center gap-2 text-amber-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span> USV mặt nước</div>
          <div className="flex items-center gap-2 text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Mục tiêu khác</div>
          <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-1 bg-cyan-400 inline-block"></span> Đường đi dự kiến</div>
          <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-1 bg-rose-400 inline-block border-t border-dashed"></span> Vùng cảnh báo</div>
        </div>
      </div>

      {/* Bottom Info Boxes matching image */}
      <div className="bg-[#050b1a] border-t border-cyan-900/60 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* THÔNG SỐ TÀU */}
        <div className="bg-[#030712] border border-cyan-950 p-3 rounded-lg shadow-inner font-mono space-y-1.5">
          <div className="text-cyan-300 font-bold uppercase text-[11px] border-b border-cyan-950 pb-1">THÔNG SỐ TÀU (Ta)</div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span className="text-slate-400">Tọa độ</span><span className="text-white font-bold">10°45'N 106°40'E</span>
            <span className="text-slate-400">Hướng</span><span className="text-white font-bold">000°</span>
            <span className="text-slate-400">Tốc độ</span><span className="text-white font-bold">18.0 kts</span>
            <span className="text-slate-400">Trạng thái</span><span className="text-emerald-400 font-bold">SẴN SÀNG</span>
          </div>
        </div>

        {/* THÔNG TIN MỤC TIÊU */}
        <div className="bg-[#030712] border border-cyan-950 p-3 rounded-lg shadow-inner font-mono space-y-1.5">
          <div className="text-cyan-300 font-bold uppercase text-[11px] border-b border-cyan-950 pb-1 flex items-center justify-between">
            <span>THÔNG TIN MỤC TIÊU</span>
            <div className="flex items-center gap-2">
              <span className="text-rose-400">
                {selectedObject && selectedObject.type !== 'OWN_SHIP' ? `♦ ${selectedObject.name}` : '(Chưa chọn mục tiêu)'}
              </span>
              {selectedObject && selectedObject.type !== 'OWN_SHIP' && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[10px] flex items-center gap-1 font-bold shadow transition-all"
                  title="Xóa mục tiêu này"
                >
                  <Trash2 className="w-3 h-3" /> Xóa
                </button>
              )}
            </div>
          </div>
          {selectedObject && selectedObject.type !== 'OWN_SHIP' ? (
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className="text-slate-400">Cự ly</span><span className="text-white font-bold">{selectedObject.range || 0} km</span>
              <span className="text-slate-400">Phương vị</span><span className="text-white font-bold">{selectedObject.bearing || 0}°</span>
              <span className="text-slate-400">Độ cao</span><span className="text-white font-bold">{selectedObject.altitude || 0} m</span>
              <span className="text-slate-400">Tốc độ</span><span className="text-white font-bold">{selectedObject.speed} {selectedObject.type === 'UAV' ? 'm/s' : 'kts'}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 py-2 text-center">
              Hãy chọn một mục tiêu trên màn hình Radar để xem thông số và xóa.
            </div>
          )}
        </div>
      </div>

      {/* Inline Editor Drawer for Selected Target */}
      {selectedObject && isEditing && selectedObject.type !== 'OWN_SHIP' && (
        <div className="bg-[#030712] border-t border-cyan-950 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in slide-in-from-bottom duration-150">
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Tên Mục Tiêu</label>
            <input
              type="text"
              value={selectedObject.name}
              onChange={e => handleUpdateSelected('name', e.target.value)}
              className="w-full bg-[#070e22] border border-cyan-900 rounded px-2 py-1 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Hướng (Heading: {selectedObject.heading}°)</label>
            <input
              type="range"
              min={0}
              max={360}
              value={selectedObject.heading}
              onChange={e => handleUpdateSelected('heading', parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Vận tốc ({selectedObject.speed})</label>
            <input
              type="number"
              value={selectedObject.speed}
              onChange={e => handleUpdateSelected('speed', parseFloat(e.target.value))}
              className="w-full bg-[#070e22] border border-cyan-900 rounded px-2 py-1 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Trạng Thái</label>
            <select
              value={selectedObject.status}
              onChange={e => handleUpdateSelected('status', e.target.value)}
              className="w-full bg-[#070e22] border border-cyan-900 rounded px-2 py-1 text-white font-mono"
            >
              <option value="BÁO ĐỘNG">BÁO ĐỘNG</option>
              <option value="ĐANG TIẾP CẬN">ĐANG TIẾP CẬN</option>
              <option value="MỤC TIÊU KHÓA">MỤC TIÊU KHÓA</option>
              <option value="ĐÃ TIÊU DIỆT">ĐÃ TIÊU DIỆT</option>
              <option value="TUẦN TRA">TUẦN TRA</option>
            </select>
          </div>
        </div>
      )}

      {/* Advanced Target Creation Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#070e22] border border-cyan-700/80 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl font-sans text-xs">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 font-mono flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" /> Tạo Mục Tiêu & Lộ Trình Tấn Công
              </h3>
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdvancedSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Loại Mục Tiêu</label>
                <select
                  value={advType}
                  onChange={e => setAdvType(e.target.value as any)}
                  className="w-full bg-[#030712] border border-cyan-900 rounded p-2 text-white font-mono"
                >
                  <option value="UAV">UAV FPV / Tự sát (Độ cao &gt; 0)</option>
                  <option value="USV">USV Cao tốc (Mặt nước)</option>
                  <option value="TARGET">Mục tiêu Khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Tên Ký Hiệu</label>
                <input
                  type="text"
                  value={advName}
                  onChange={e => setAdvName(e.target.value)}
                  className="w-full bg-[#030712] border border-cyan-900 rounded p-2 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">Phương Vị (Bearing)</label>
                  <div className="flex space-x-1">
                    {[30, 90, 120, 270].map(deg => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setAdvBearing(deg)}
                        className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${advBearing === deg ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={advBearing}
                    onChange={e => setAdvBearing(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={advBearing}
                    onChange={e => setAdvBearing(parseInt(e.target.value) || 0)}
                    className="w-16 bg-[#030712] border border-cyan-900 rounded p-1 text-white font-mono text-center text-xs"
                  />
                  <span className="text-cyan-400 font-mono text-xs">°</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">Cự Ly Khởi Điểm ({advRange} km)</label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={advRange}
                    onChange={e => setAdvRange(parseFloat(e.target.value))}
                    className="w-full bg-[#030712] border border-cyan-900 rounded p-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">Vận Tốc ({advSpeed} m/s / kts)</label>
                  <input
                    type="number"
                    value={advSpeed}
                    onChange={e => setAdvSpeed(parseFloat(e.target.value))}
                    className="w-full bg-[#030712] border border-cyan-900 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              {advType === 'UAV' && (
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">Độ Cao Khởi Điểm ({advAltitude} m)</label>
                  <input
                    type="number"
                    value={advAltitude}
                    onChange={e => setAdvAltitude(parseFloat(e.target.value))}
                    className="w-full bg-[#030712] border border-cyan-900 rounded p-2 text-white font-mono"
                  />
                </div>
              )}

              <div className="bg-[#030712] p-2.5 rounded border border-cyan-950 text-[11px] font-mono text-cyan-300">
                ℹ️ Mục tiêu sẽ tự động định hướng và lao thẳng vào tàu chỉ huy (0,0) theo lộ trình tính toán.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow"
                >
                  Xác Nhận Tạo Mục Tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
