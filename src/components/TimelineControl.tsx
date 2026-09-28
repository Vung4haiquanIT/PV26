import React from 'react';
import { Play, Pause, Square, RotateCcw, FastForward, History } from 'lucide-react';
import { SimulationState } from '../types';
import { createInitialSimulationState } from '../scenario/initialScenario';

interface TimelineControlProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onOpenReplay: () => void;
}

export const TimelineControl: React.FC<TimelineControlProps> = ({ state, setState, onOpenReplay }) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const millis = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const handlePlayToggle = () => {
    setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const handleStop = () => {
    setState(s => ({ ...s, isPlaying: false, time: 0 }));
  };

  const handleReset = () => {
    setState(createInitialSimulationState());
  };

  const handleSpeedChange = (speed: number) => {
    setState(s => ({ ...s, speed }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setState(s => ({ ...s, time }));
  };

  return (
    <div className="h-20 bg-[#070e22] border-t border-cyan-900/40 px-6 flex items-center justify-between select-none z-30 shadow-2xl">
      {/* Playback Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePlayToggle}
          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
            state.isPlaying
              ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-amber-500/20 shadow-lg'
              : 'bg-cyan-600/30 border-cyan-500 text-cyan-300 hover:bg-cyan-600/40'
          }`}
          title={state.isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play)'}
        >
          {state.isPlaying ? <Pause className="w-5 h-5 fill-amber-300" /> : <Play className="w-5 h-5 fill-cyan-300" />}
        </button>

        <button
          onClick={handleStop}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
          title="Dừng (Stop)"
        >
          <Square className="w-4 h-4 fill-slate-300" />
        </button>

        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
          title="Đặt lại (Reset)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenReplay}
          className="px-3 h-10 rounded-lg flex items-center gap-2 bg-blue-950/60 border border-blue-800/60 text-blue-300 hover:bg-blue-900/60 transition-all text-xs font-semibold"
          title="Nhật ký và Phát lại (Replay / AAR)"
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>REPLAY</span>
        </button>

        <div className="h-8 w-[1px] bg-cyan-900/50 mx-1"></div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Thời gian mô phỏng</span>
          <span className="text-sm font-mono font-bold text-cyan-300 tracking-wider">
            {formatTime(state.time)} / {formatTime(state.duration)}
          </span>
        </div>
      </div>

      {/* Timeline Scrubber & Milestones */}
      <div className="flex-1 max-w-2xl mx-8 hidden md:block">
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>00:00</span>
          <span className="text-cyan-400">00:15 Bắt đầu</span>
          <span className="text-amber-400">00:30 Diễn biến</span>
          <span className="text-rose-400">00:45 Tiêu diệt</span>
          <span>01:30 Đánh chặn</span>
          <span>10:00 Kết thúc</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={state.duration}
            step={0.5}
            value={state.time}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-cyan-900/60 shadow-inner"
          />
        </div>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-400 uppercase font-medium flex items-center gap-1 hidden lg:flex">
          <FastForward className="w-3.5 h-3.5 text-cyan-400" /> Tốc độ:
        </span>
        <div className="flex bg-[#050b1a] p-1 rounded-lg border border-cyan-950 space-x-1">
          {[0.5, 1, 2, 5, 10].map(spd => (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                state.speed === spd
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
