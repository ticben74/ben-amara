
import React, { useState, useMemo, useRef } from 'react';
import { InterventionType, InterventionItem } from '../types';

interface Props {
  interventions: InterventionItem[];
  onSelectIntervention: (item: InterventionItem) => void;
  selectedId?: string;
}

interface PointWithPos {
  id: string;
  nx: number;
  ny: number;
  type: InterventionType;
  location: string;
  item: InterventionItem;
  isPathPoint?: boolean;
}

export const MapViewer: React.FC<Props> = ({ interventions, onSelectIntervention, selectedId }) => {
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const { normalizedItems, pathLines } = useMemo(() => {
    if (interventions.length === 0) return { normalizedItems: [], pathLines: [] };
    
    const allCoords: {lat: number, lng: number}[] = [];
    interventions.forEach(item => {
      if (item.type === InterventionType.PATH && item.pathPoints) {
        item.pathPoints.forEach(p => allCoords.push({lat: p.latitude, lng: p.longitude}));
      } else {
        allCoords.push({lat: item.latitude, lng: item.longitude});
      }
    });

    const lats = allCoords.map(c => c.lat);
    const lngs = allCoords.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    const normalize = (lat: number, lng: number) => ({
      nx: ((lng - minLng) / lngRange) * 1000,
      ny: (1 - (lat - minLat) / latRange) * 1000
    });

    const items: PointWithPos[] = [];
    const lines: {points: {nx: number, ny: number}[], id: string}[] = [];

    interventions.forEach(item => {
      if (item.type === InterventionType.PATH && item.pathPoints) {
        const sortedPoints = [...item.pathPoints].sort((a, b) => a.order - b.order);
        const linePoints: {nx: number, ny: number}[] = [];
        sortedPoints.forEach(p => {
          const pos = normalize(p.latitude, p.longitude);
          linePoints.push(pos);
          items.push({ ...pos, id: p.id, type: item.type, location: p.name, item, isPathPoint: true });
        });
        lines.push({ points: linePoints, id: item.id });
      } else {
        const pos = normalize(item.latitude, item.longitude);
        items.push({ ...pos, id: item.id, type: item.type, location: item.location, item });
      }
    });

    return { normalizedItems: items, pathLines: lines };
  }, [interventions]);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.anchor-panel')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const onMouseUp = () => setIsDragging(false);

  const getMarkerIcon = (type: InterventionType) => {
    switch (type) {
      case InterventionType.BENCH: return '🎙️';
      case InterventionType.MURAL: return '🎨';
      case InterventionType.DOOR: return '🚪';
      case InterventionType.PATH: return '🛤️';
      default: return '📍';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[750px] rounded-[3.5rem] border border-slate-800 overflow-hidden shadow-3xl select-none cursor-grab active:cursor-grabbing bg-[#0a0f1e]"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="absolute top-8 right-10 z-20 pointer-events-none text-right">
        <h3 className="text-3xl font-black text-white/90">الخريطة <span className="text-indigo-500">المكانية</span></h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Spatial Visualization v3.2</p>
      </div>

      <div 
        className="absolute inset-0 transition-transform duration-100 pointer-events-none"
        style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoomLevel})`, transformOrigin: '0 0' }}
      >
        <div className="absolute inset-[-5000px] opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
        
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          {pathLines.map((line) => (
            <polyline
              key={line.id + '-glow'}
              points={line.points.map(p => `${p.nx},${p.ny}`).join(' ')}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="opacity-100"
            />
          ))}
        </svg>

        {normalizedItems.map((point) => {
          const isSelected = selectedId === point.item.id;
          return (
            <div 
              key={point.id}
              className={`absolute pointer-events-auto transition-all duration-300 ${isSelected ? 'z-50' : 'z-10'}`}
              style={{ left: `${point.nx}px`, top: `${point.ny}px` }}
              onClick={(e) => { e.stopPropagation(); onSelectIntervention(point.item); }}
            >
              <div className="relative group -translate-x-1/2 -translate-y-1/2">
                {/* Pulsing ring for selected item */}
                {isSelected && (
                  <div className="absolute inset-0 w-8 h-8 -translate-x-0 -translate-y-0 bg-indigo-500/40 rounded-xl animate-ping scale-[2]"></div>
                )}
                
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-500 border-2 shadow-2xl bg-slate-900 
                  ${isSelected 
                    ? 'border-indigo-500 scale-150 shadow-[0_0_30px_rgba(99,102,241,0.6)]' 
                    : 'border-slate-700 hover:border-indigo-500 hover:scale-125'}`}
                >
                  {getMarkerIcon(point.type)}
                </div>
                
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full whitespace-nowrap shadow-xl transition-all
                  ${isSelected ? 'opacity-100 translate-y-2' : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0'}`}
                >
                  <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                    {point.location}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-10 left-10 z-40 flex flex-col gap-3">
        <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 8))} className="w-12 h-12 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl font-bold hover:bg-slate-800 transition-colors">+</button>
        <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))} className="w-12 h-12 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl font-bold hover:bg-slate-800 transition-colors">-</button>
      </div>
    </div>
  );
};
