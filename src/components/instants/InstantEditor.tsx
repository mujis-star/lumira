'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  InstantAdjustments,
  InstantOverlayText,
  InstantOverlaySticker,
  InstantStickerType,
  AttachedMusic,
  UserProfile,
} from '@/lib/types';
import {
  DEFAULT_ADJUSTMENTS,
  INSTANT_FILTERS,
  generateInstantCssFilter,
  sounds,
} from '@/lib/utils';
import { MusicSelectorModal } from '@/components/music/MusicSelectorModal';
import { Avatar } from '@/components/ui/Avatar';
import {
  Sliders,
  Sparkles,
  Type,
  Smile,
  Brush,
  Music as MusicIcon,
  Layers,
  Undo2,
  Redo2,
  RotateCcw,
  Eye,
  Check,
  X,
  Trash2,
  Plus,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  VolumeX,
  AtSign,
  MapPin,
  Hash,
  Calendar,
  Clock,
  Eraser,
  Highlighter,
  Scissors,
} from 'lucide-react';

interface InstantEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  allUsers: UserProfile[];
  onCancel: () => void;
  onContinue: (editorResult: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    filterId: string;
    filterIntensity: number;
    adjustments: InstantAdjustments;
    textOverlays: InstantOverlayText[];
    stickers: InstantOverlaySticker[];
    drawingDataUrl?: string;
    attachedMusic?: AttachedMusic;
    musicVolume: number;
    videoVolume: number;
    videoTrim?: { start: number; end: number };
    videoSpeed: number;
  }) => void;
}

type EditorTab = 'adjust' | 'filters' | 'text' | 'stickers' | 'draw' | 'video' | 'music' | 'layers';

const FONT_FAMILIES = [
  { id: 'sans', name: 'Sans', fontClass: 'font-sans' },
  { id: 'serif', name: 'Serif', fontClass: 'font-serif' },
  { id: 'mono', name: 'Neon Mono', fontClass: 'font-mono' },
  { id: 'cursive', name: 'Script', fontClass: 'font-sans italic' },
  { id: 'impact', name: 'Bold Headline', fontClass: 'font-black tracking-tight uppercase' },
];

const COLOR_PALETTE = [
  '#ffffff',
  '#000000',
  '#0095f6',
  '#ec4899',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#e2e8f0',
];

export function InstantEditor({
  mediaUrl,
  mediaType,
  allUsers,
  onCancel,
  onContinue,
}: InstantEditorProps) {
  // Editor Active Tab
  const [activeTab, setActiveTab] = useState<EditorTab>('filters');

  // Adjustments & Filters State
  const [adjustments, setAdjustments] = useState<InstantAdjustments>(DEFAULT_ADJUSTMENTS);
  const [selectedFilterId, setSelectedFilterId] = useState<string>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);

  // Overlays State
  const [textOverlays, setTextOverlays] = useState<InstantOverlayText[]>([]);
  const [stickers, setStickers] = useState<InstantOverlaySticker[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Text Composer Sub-modal
  const [isComposingText, setIsComposingText] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftFont, setDraftFont] = useState('sans');
  const [draftColor, setDraftColor] = useState('#ffffff');
  const [draftBg, setDraftBg] = useState<string | undefined>('rgba(0,0,0,0.5)');
  const [draftBold, setDraftBold] = useState(true);
  const [draftItalic, setDraftItalic] = useState(false);
  const [draftFontSize, setDraftFontSize] = useState(24);
  const [draftAlign, setDraftAlign] = useState<'left' | 'center' | 'right'>('center');

  // Sticker Picker Sub-modal
  const [stickerPickerMode, setStickerPickerMode] = useState<InstantStickerType | null>(null);
  const [stickerInputText, setStickerInputText] = useState('');

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawTool, setDrawTool] = useState<'brush' | 'highlighter' | 'eraser'>('brush');
  const [drawColor, setDrawColor] = useState('#0095f6');
  const [drawSize, setDrawSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [drawingRedoStack, setDrawingRedoStack] = useState<ImageData[]>([]);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(15);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(15);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoSpeed, setVideoSpeed] = useState(1);

  // Music State
  const [attachedMusic, setAttachedMusic] = useState<AttachedMusic | undefined>(undefined);
  const [musicVolume, setMusicVolume] = useState(1);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // History State for Undo/Redo of general edits
  interface HistorySnapshot {
    adjustments: InstantAdjustments;
    filterId: string;
    filterIntensity: number;
    textOverlays: InstantOverlayText[];
    stickers: InstantOverlaySticker[];
  }
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      adjustments: DEFAULT_ADJUSTMENTS,
      filterId: 'normal',
      filterIntensity: 100,
      textOverlays: [],
      stickers: [],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Hold to Compare State
  const [isComparing, setIsComparing] = useState(false);

  // Dragging state for text & stickers
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'text' | 'sticker'; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const pushHistory = useCallback((newAdj = adjustments, newFilt = selectedFilterId, newInt = filterIntensity, newTxt = textOverlays, newStk = stickers) => {
    const nextSnapshot: HistorySnapshot = {
      adjustments: { ...newAdj },
      filterId: newFilt,
      filterIntensity: newInt,
      textOverlays: [...newTxt],
      stickers: [...newStk],
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), nextSnapshot]);
    setHistoryIndex((prev) => prev + 1);
  }, [adjustments, selectedFilterId, filterIntensity, textOverlays, stickers, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setAdjustments(target.adjustments);
      setSelectedFilterId(target.filterId);
      setFilterIntensity(target.filterIntensity);
      setTextOverlays(target.textOverlays);
      setStickers(target.stickers);
      setHistoryIndex(historyIndex - 1);
      sounds.playPop();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setAdjustments(target.adjustments);
      setSelectedFilterId(target.filterId);
      setFilterIntensity(target.filterIntensity);
      setTextOverlays(target.textOverlays);
      setStickers(target.stickers);
      setHistoryIndex(historyIndex + 1);
      sounds.playPop();
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all adjustments, filters, overlays, and drawings?')) {
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setSelectedFilterId('normal');
      setFilterIntensity(100);
      setTextOverlays([]);
      setStickers([]);
      setAttachedMusic(undefined);
      clearDrawingCanvas();
      pushHistory(DEFAULT_ADJUSTMENTS, 'normal', 100, [], []);
      sounds.playPop();
    }
  };

  // Canvas Drawing Handlers
  const saveDrawingState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory((prev) => [...prev, snapshot]);
    setDrawingRedoStack([]);
  };

  const undoDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...drawingHistory];
    const current = newHistory.pop();
    if (current) {
      setDrawingRedoStack((prev) => [...prev, current]);
    }

    if (newHistory.length > 0) {
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDrawingHistory(newHistory);
  };

  const redoDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingRedoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newRedo = [...drawingRedoStack];
    const item = newRedo.pop();
    if (item) {
      ctx.putImageData(item, 0, 0);
      setDrawingHistory((prev) => [...prev, item]);
    }
    setDrawingRedoStack(newRedo);
  };

  const clearDrawingCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveDrawingState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveDrawingState();
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = drawSize * 1.5;
    } else if (drawTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize * 2;
      ctx.globalAlpha = 0.45;
      ctx.lineCap = 'square';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize;
      ctx.globalAlpha = drawOpacity;
      ctx.lineCap = 'round';
    }
    ctx.lineJoin = 'round';
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Pointer drag events for text & stickers on preview canvas
  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'text' | 'sticker', curX: number, curY: number) => {
    e.stopPropagation();
    setDraggingItem({
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      origX: curX,
      origY: curY,
    });
    if (type === 'text') setActiveTextId(id);
    if (type === 'sticker') setActiveStickerId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingItem) return;
    const dx = e.clientX - draggingItem.startX;
    const dy = e.clientY - draggingItem.startY;

    // Convert pixel delta to percentage offset based on preview container size (~400px approx)
    const pctX = Math.max(5, Math.min(95, draggingItem.origX + (dx / 320) * 100));
    const pctY = Math.max(5, Math.min(95, draggingItem.origY + (dy / 560) * 100));

    if (draggingItem.type === 'text') {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === draggingItem.id ? { ...t, x: pctX, y: pctY } : t))
      );
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === draggingItem.id ? { ...s, x: pctX, y: pctY } : s))
      );
    }
  };

  const handlePointerUp = () => {
    if (draggingItem) {
      setDraggingItem(null);
      pushHistory();
    }
  };

  // Text Save Handler
  const handleSaveText = () => {
    if (!draftText.trim()) return;

    if (activeTextId) {
      // Editing existing
      const updated = textOverlays.map((t) =>
        t.id === activeTextId
          ? {
              ...t,
              text: draftText.trim(),
              fontFamily: draftFont,
              color: draftColor,
              backgroundColor: draftBg,
              bold: draftBold,
              italic: draftItalic,
              fontSize: draftFontSize,
              align: draftAlign,
            }
          : t
      );
      setTextOverlays(updated);
      pushHistory(adjustments, selectedFilterId, filterIntensity, updated, stickers);
    } else {
      // Creating new
      const newText: InstantOverlayText = {
        id: `txt-${Date.now()}`,
        text: draftText.trim(),
        x: 50,
        y: 50,
        fontFamily: draftFont,
        fontSize: draftFontSize,
        color: draftColor,
        backgroundColor: draftBg,
        bold: draftBold,
        italic: draftItalic,
        align: draftAlign,
        shadow: true,
      };
      const updated = [...textOverlays, newText];
      setTextOverlays(updated);
      pushHistory(adjustments, selectedFilterId, filterIntensity, updated, stickers);
    }

    setIsComposingText(false);
    setActiveTextId(null);
    setDraftText('');
    sounds.playPop();
  };

  // Add Sticker Handler
  const handleAddSticker = (type: InstantStickerType, content: string, extraData?: InstantOverlaySticker['extraData']) => {
    const newSticker: InstantOverlaySticker = {
      id: `stk-${Date.now()}`,
      type,
      content,
      x: 50,
      y: 35 + stickers.length * 8,
      scale: 1,
      rotation: 0,
      extraData,
    };

    const updated = [...stickers, newSticker];
    setStickers(updated);
    pushHistory(adjustments, selectedFilterId, filterIntensity, textOverlays, updated);
    setStickerPickerMode(null);
    setStickerInputText('');
    sounds.playPop();
  };

  // Final Publish Payload
  const handleProceedToShare = () => {
    let drawingDataUrl: string | undefined;
    if (canvasRef.current && drawingHistory.length > 0) {
      drawingDataUrl = canvasRef.current.toDataURL('image/png');
    }

    onContinue({
      mediaUrl,
      mediaType,
      filterId: selectedFilterId,
      filterIntensity,
      adjustments,
      textOverlays,
      stickers,
      drawingDataUrl,
      attachedMusic,
      musicVolume,
      videoVolume,
      videoTrim: mediaType === 'video' ? { start: videoTrimStart, end: videoTrimEnd } : undefined,
      videoSpeed,
    });
  };

  const computedFilter = isComparing
    ? 'none'
    : generateInstantCssFilter(adjustments, selectedFilterId, filterIntensity);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 z-50 flex flex-col bg-[#07070b] select-none overflow-hidden"
    >
      {/* 1. TOP HEADER CONTROLS */}
      <div className="shrink-0 px-4 py-3 bg-[var(--glass-modal-bg)] backdrop-blur-3xl border-b border-[var(--glass-border)] flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* History Controls */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl text-white/75 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl text-white/75 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="p-2 rounded-xl text-white/75 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset All Edits"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Hold to Compare Toggle */}
        <button
          type="button"
          onMouseDown={() => setIsComparing(true)}
          onMouseUp={() => setIsComparing(false)}
          onTouchStart={() => setIsComparing(true)}
          onTouchEnd={() => setIsComparing(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            isComparing
              ? 'bg-amber-500 text-black border-amber-400'
              : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isComparing ? 'Original View' : 'Hold Compare'}</span>
        </button>

        {/* Next / Share Action */}
        <button
          type="button"
          onClick={handleProceedToShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#0095f6] to-[#7857ff] hover:from-[#1877f2] hover:to-[#6842ff] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <span>Continue</span>
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. CENTER STAGE: PREVIEW CANVAS */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-black/40">
        <div
          style={{
            transform: `scale(${isComparing ? 1 : adjustments.zoom}) translate(${isComparing ? 0 : adjustments.panX}px, ${isComparing ? 0 : adjustments.panY}px) rotate(${isComparing ? 0 : adjustments.rotate + adjustments.straighten}deg) scaleX(${adjustments.flipH && !isComparing ? -1 : 1}) scaleY(${adjustments.flipV && !isComparing ? -1 : 1})`,
          }}
          className={`relative max-h-[70vh] sm:max-h-[75vh] w-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-[var(--glass-border)] transition-transform duration-100 ${
            adjustments.aspectRatio === '1:1'
              ? 'aspect-square'
              : adjustments.aspectRatio === '4:5'
              ? 'aspect-[4/5]'
              : adjustments.aspectRatio === '16:9'
              ? 'aspect-[16/9]'
              : 'aspect-[9/16]'
          }`}
        >
          {/* Base Media */}
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              style={{ filter: computedFilter }}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              muted={videoVolume === 0}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration || 15;
                setVideoDuration(dur);
                setVideoTrimEnd(Math.min(15, dur));
              }}
            />
          ) : (
            <Image
              src={mediaUrl}
              alt="Instant editing media"
              fill
              className="object-cover pointer-events-none"
              style={{ filter: computedFilter }}
              unoptimized
            />
          )}

          {/* Vignette Overlay */}
          {adjustments.vignette > 0 && !isComparing && (
            <div
              style={{
                background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${adjustments.vignette / 100}) 100%)`,
              }}
              className="absolute inset-0 pointer-events-none z-10"
            />
          )}

          {/* Grain Overlay */}
          {adjustments.grain > 0 && !isComparing && (
            <div
              style={{ opacity: adjustments.grain / 100 }}
              className="absolute inset-0 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] mix-blend-overlay z-10"
            />
          )}

          {/* HTML5 Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            onPointerDown={startDraw}
            onPointerMove={drawMove}
            onPointerUp={stopDraw}
            className={`absolute inset-0 w-full h-full z-20 ${
              activeTab === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
          />

          {/* Render Text Overlays */}
          {!isComparing &&
            textOverlays.map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id, 'text', item.x, item.y)}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: item.color,
                  backgroundColor: item.backgroundColor,
                  fontSize: `${item.fontSize}px`,
                }}
                className={`absolute z-30 px-3 py-1.5 rounded-2xl cursor-grab active:cursor-grabbing border ${
                  activeTextId === item.id ? 'border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/50' : 'border-transparent'
                } ${item.bold ? 'font-bold' : ''} ${item.italic ? 'italic' : ''} ${item.shadow ? 'drop-shadow-lg' : ''}`}
              >
                <span>{item.text}</span>
                {activeTextId === item.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextOverlays((prev) => prev.filter((t) => t.id !== item.id));
                      setActiveTextId(null);
                      pushHistory();
                    }}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

          {/* Render Stickers & Dynamic Widgets */}
          {!isComparing &&
            stickers.map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id, 'sticker', item.x, item.y)}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) scale(${item.scale || 1}) rotate(${item.rotation || 0}deg)`,
                }}
                className={`absolute z-30 cursor-grab active:cursor-grabbing ${
                  activeStickerId === item.id ? 'ring-2 ring-[var(--accent-blue)] rounded-2xl p-1' : ''
                }`}
              >
                {item.type === 'emoji' ? (
                  <span className="text-4xl drop-shadow-md">{item.content}</span>
                ) : item.type === 'mention' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--glass-modal-bg)] backdrop-blur-xl border border-[var(--glass-border-highlight)] text-white text-xs font-bold shadow-lg">
                    <AtSign className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    <span>{item.content}</span>
                  </div>
                ) : item.type === 'location' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500/90 to-amber-500/90 backdrop-blur-xl text-white text-xs font-bold shadow-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{item.content}</span>
                  </div>
                ) : item.type === 'hashtag' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-600/90 backdrop-blur-xl text-white text-xs font-bold shadow-lg">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{item.content}</span>
                  </div>
                ) : item.type === 'time' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/20 text-white font-mono text-xs font-bold shadow-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.content}</span>
                  </div>
                ) : item.type === 'date' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-600/90 backdrop-blur-xl text-white text-xs font-bold shadow-lg">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.content}</span>
                  </div>
                ) : (
                  /* Music Widget */
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/25 text-white text-xs font-bold shadow-lg">
                    <span className="animate-pulse text-blue-400">ılı</span>
                    <span className="truncate max-w-[150px]">{item.content}</span>
                  </div>
                )}

                {activeStickerId === item.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStickers((prev) => prev.filter((s) => s.id !== item.id));
                      setActiveStickerId(null);
                      pushHistory();
                    }}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 3. TOOL DRAWER / CONTROLS PANEL */}
      <div className="shrink-0 bg-[var(--glass-modal-bg)] backdrop-blur-3xl border-t border-[var(--glass-border)] z-30 p-3 space-y-3">
        {/* TAB 1: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white/90">Filter Presets</span>
              {selectedFilterId !== 'normal' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/60">Intensity:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filterIntensity}
                    onChange={(e) => {
                      setFilterIntensity(Number(e.target.value));
                    }}
                    onMouseUp={() => pushHistory()}
                    className="w-24 accent-[#0095f6]"
                  />
                  <span className="text-white font-bold w-6">{filterIntensity}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {INSTANT_FILTERS.map((preset) => {
                const isSelected = selectedFilterId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedFilterId(preset.id);
                      pushHistory(adjustments, preset.id, filterIntensity);
                      sounds.playPop();
                    }}
                    className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-blue)]/20 border-2 border-[var(--accent-blue)] text-white scale-105'
                        : 'border border-white/10 hover:border-white/30 text-white/70'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-inner bg-neutral-800">
                      <Image
                        src={mediaUrl}
                        alt={preset.name}
                        fill
                        className="object-cover"
                        style={{ filter: preset.cssFilter }}
                        unoptimized
                      />
                    </div>
                    <span className="text-[11px] font-semibold truncate max-w-[64px] text-center">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ADJUSTMENTS */}
        {activeTab === 'adjust' && (
          <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
            {/* Aspect Ratio & Transform Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {(['free', '1:1', '4:5', '9:16', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => {
                      setAdjustments((prev) => ({ ...prev, aspectRatio: ratio }));
                      pushHistory({ ...adjustments, aspectRatio: ratio });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      adjustments.aspectRatio === ratio
                        ? 'bg-[var(--accent-blue)] text-white shadow'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {ratio.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextRot = (adjustments.rotate + 90) % 360;
                    setAdjustments((prev) => ({ ...prev, rotate: nextRot }));
                    pushHistory({ ...adjustments, rotate: nextRot });
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustments((prev) => ({ ...prev, flipH: !prev.flipH }));
                    pushHistory({ ...adjustments, flipH: !adjustments.flipH });
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustments((prev) => ({ ...prev, flipV: !prev.flipV }));
                    pushHistory({ ...adjustments, flipV: !adjustments.flipV });
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Adjustments Sliders Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Brightness</span>
                  <span>{adjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={180}
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#0095f6]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Contrast</span>
                  <span>{adjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={180}
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#0095f6]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Saturation</span>
                  <span>{adjustments.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={adjustments.saturation}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, saturation: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#0095f6]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Temperature</span>
                  <span>{adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={adjustments.temperature}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#f59e0b]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Vignette</span>
                  <span>{adjustments.vignette}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={adjustments.vignette}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, vignette: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#8b5cf6]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold mb-1">
                  <span>Grain</span>
                  <span>{adjustments.grain}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={adjustments.grain}
                  onChange={(e) => setAdjustments((prev) => ({ ...prev, grain: Number(e.target.value) }))}
                  onMouseUp={() => pushHistory()}
                  className="w-full accent-[#ec4899]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DRAW */}
        {activeTab === 'draw' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {/* Brush Tools */}
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDrawTool('brush')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    drawTool === 'brush' ? 'bg-[#0095f6] text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Brush className="w-3.5 h-3.5" />
                  <span>Brush</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('highlighter')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    drawTool === 'highlighter' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Glow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('eraser')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    drawTool === 'eraser' ? 'bg-rose-500 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>
              </div>

              {/* Stroke History */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={undoDrawing}
                  disabled={drawingHistory.length === 0}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white"
                  title="Undo stroke"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={redoDrawing}
                  disabled={drawingRedoStack.length === 0}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white"
                  title="Redo stroke"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearDrawingCanvas}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-400"
                  title="Clear drawing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Colors & Size */}
            {drawTool !== 'eraser' && (
              <div className="flex items-center justify-between gap-4">
                {/* Color Palette */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDrawColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full shrink-0 transition-transform ${
                        drawColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                      }`}
                    />
                  ))}
                </div>

                {/* Size & Opacity Slider */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/70">Size:</span>
                    <input
                      type="range"
                      min={2}
                      max={40}
                      value={drawSize}
                      onChange={(e) => setDrawSize(Number(e.target.value))}
                      className="w-16 accent-[#0095f6]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/70">Opacity:</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={drawOpacity}
                      onChange={(e) => setDrawOpacity(Number(e.target.value))}
                      className="w-16 accent-[#0095f6]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TEXT */}
        {activeTab === 'text' && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/80">
              {textOverlays.length === 0 ? 'No text overlays added yet' : `${textOverlays.length} text layer(s)`}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftText('');
                setActiveTextId(null);
                setIsComposingText(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[var(--accent-blue-hover)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Text</span>
            </button>
          </div>
        )}

        {/* TAB 5: STICKERS & WIDGETS */}
        {activeTab === 'stickers' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setStickerPickerMode('emoji')}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold">Emoji</span>
              </button>
              <button
                type="button"
                onClick={() => setStickerPickerMode('mention')}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <AtSign className="w-4 h-4 text-[var(--accent-blue)]" />
                <span className="text-[11px] font-bold">@Mention</span>
              </button>
              <button
                type="button"
                onClick={() => setStickerPickerMode('location')}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-rose-400" />
                <span className="text-[11px] font-bold">Location</span>
              </button>
              <button
                type="button"
                onClick={() => setStickerPickerMode('hashtag')}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Hash className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-bold">#Hashtag</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  handleAddSticker('time', `⏰ ${timeStr}`);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold">Time</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  handleAddSticker('date', `📅 ${dateStr}`);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-bold">Date</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: VIDEO TIMELINE */}
        {activeTab === 'video' && mediaType === 'video' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Video Duration & Trim:</span>
              <span className="text-white/70">
                {videoTrimStart.toFixed(1)}s – {videoTrimEnd.toFixed(1)}s ({(videoTrimEnd - videoTrimStart).toFixed(1)}s)
              </span>
            </div>

            {/* Timeline Scrubber */}
            <div className="relative h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-between px-3 overflow-hidden">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="w-1 h-5 bg-white/30 rounded-full" />
              ))}
              <div
                style={{
                  left: `${(videoTrimStart / videoDuration) * 100}%`,
                  width: `${((videoTrimEnd - videoTrimStart) / videoDuration) * 100}%`,
                }}
                className="absolute inset-y-0 bg-[var(--accent-blue)]/20 border-2 border-[var(--accent-blue)] rounded-xl pointer-events-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/70 text-[11px]">Trim Start: {videoTrimStart}s</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, videoTrimEnd - 1)}
                  step={0.5}
                  value={videoTrimStart}
                  onChange={(e) => setVideoTrimStart(Number(e.target.value))}
                  className="w-full accent-[#0095f6]"
                />
              </div>

              <div>
                <span className="text-white/70 text-[11px]">Trim End: {videoTrimEnd}s</span>
                <input
                  type="range"
                  min={videoTrimStart + 1}
                  max={videoDuration}
                  step={0.5}
                  value={videoTrimEnd}
                  onChange={(e) => setVideoTrimEnd(Number(e.target.value))}
                  className="w-full accent-[#0095f6]"
                />
              </div>
            </div>

            {/* Video Audio Volume & Speed */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoVolume(videoVolume > 0 ? 0 : 1)}
                  className="p-1.5 rounded-xl bg-white/10 text-white"
                >
                  {videoVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={videoVolume}
                  onChange={(e) => setVideoVolume(Number(e.target.value))}
                  className="w-20 accent-[#0095f6]"
                />
              </div>

              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setVideoSpeed(spd);
                      if (videoRef.current) videoRef.current.playbackRate = spd;
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      videoSpeed === spd ? 'bg-[#0095f6] text-white' : 'text-white/70'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MUSIC */}
        {activeTab === 'music' && (
          <div className="space-y-3">
            {attachedMusic ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                    <Image src={attachedMusic.coverImage} alt={attachedMusic.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{attachedMusic.title}</p>
                    <p className="text-[11px] text-white/70 truncate">{attachedMusic.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl">
                    <Volume2 className="w-3.5 h-3.5 text-white/70" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                      className="w-16 accent-[#0095f6]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMusicModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedMusic(undefined);
                      sounds.playPop();
                    }}
                    className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Add background soundtrack to your Instant</span>
                <button
                  type="button"
                  onClick={() => setIsMusicModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[var(--accent-blue-hover)]"
                >
                  <MusicIcon className="w-3.5 h-3.5" />
                  <span>Choose Music</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: LAYERS */}
        {activeTab === 'layers' && (
          <div className="space-y-2 max-h-36 overflow-y-auto">
            <p className="text-xs font-bold text-white">Active Layers ({textOverlays.length + stickers.length + (attachedMusic ? 1 : 0) + 1})</p>
            <div className="space-y-1 text-xs">
              {textOverlays.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/10 text-white">
                  <span className="truncate max-w-[200px]">🔤 {t.text}</span>
                  <button
                    type="button"
                    onClick={() => setTextOverlays((prev) => prev.filter((x) => x.id !== t.id))}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {stickers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-white/10 text-white">
                  <span className="truncate max-w-[200px]">🏷️ {s.type}: {s.content}</span>
                  <button
                    type="button"
                    onClick={() => setStickers((prev) => prev.filter((x) => x.id !== s.id))}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {attachedMusic && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/10 text-white">
                  <span className="truncate max-w-[200px]">🎵 Music: {attachedMusic.title}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedMusic(undefined)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. BOTTOM MAIN TOOLBAR TABS */}
        <div className="flex items-center justify-around pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'filters' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'adjust' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px]">Adjust</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'text' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px]">Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'stickers' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Smile className="w-5 h-5" />
            <span className="text-[10px]">Stickers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'draw' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Brush className="w-5 h-5" />
            <span className="text-[10px]">Draw</span>
          </button>

          {mediaType === 'video' && (
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'video' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <Scissors className="w-5 h-5" />
              <span className="text-[10px]">Trim</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'music' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <MusicIcon className="w-5 h-5" />
            <span className="text-[10px]">Music</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'layers' ? 'text-[var(--accent-blue)] bg-white/10 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">Layers</span>
          </button>
        </div>
      </div>

      {/* TEXT COMPOSER SUB-MODAL */}
      {isComposingText && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsComposingText(false)}
              className="p-2 text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-white">Add Text</span>
            <button
              type="button"
              onClick={handleSaveText}
              disabled={!draftText.trim()}
              className="px-4 py-1.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-bold disabled:opacity-40"
            >
              Done
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <input
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Type something..."
              autoFocus
              style={{
                color: draftColor,
                backgroundColor: draftBg,
                fontSize: `${draftFontSize}px`,
              }}
              className={`w-full max-w-md p-4 text-center rounded-2xl focus:outline-none border border-white/20 shadow-2xl ${
                draftFont === 'serif'
                  ? 'font-serif'
                  : draftFont === 'mono'
                  ? 'font-mono'
                  : draftFont === 'cursive'
                  ? 'font-sans italic'
                  : 'font-sans'
              } ${draftBold ? 'font-bold' : ''}`}
            />
          </div>

          {/* Text Styling Controls */}
          <div className="space-y-3 pb-6 max-w-lg mx-auto w-full">
            {/* Typography Modifiers Row: Bold, Italic, Bg, Align, Size */}
            <div className="flex items-center justify-center gap-2 bg-white/10 p-2 rounded-2xl">
              <button
                type="button"
                onClick={() => setDraftBold(!draftBold)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  draftBold ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                B
              </button>

              <button
                type="button"
                onClick={() => setDraftItalic(!draftItalic)}
                className={`px-3 py-1 rounded-xl text-xs italic font-serif transition-all ${
                  draftItalic ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                I
              </button>

              <button
                type="button"
                onClick={() =>
                  setDraftBg((prev) =>
                    prev ? undefined : 'rgba(0,0,0,0.65)'
                  )
                }
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  draftBg ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Highlight
              </button>

              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                {(['left', 'center', 'right'] as const).map((aln) => (
                  <button
                    key={aln}
                    type="button"
                    onClick={() => setDraftAlign(aln)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold ${
                      draftAlign === aln ? 'bg-[#0095f6] text-white' : 'text-white/60'
                    }`}
                  >
                    {aln[0]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/70">A:</span>
                <input
                  type="range"
                  min={14}
                  max={48}
                  value={draftFontSize}
                  onChange={(e) => setDraftFontSize(Number(e.target.value))}
                  className="w-16 accent-[#0095f6]"
                />
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDraftFont(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${
                    draftFont === f.id ? 'bg-white text-black font-bold' : 'bg-white/10 text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraftColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full shrink-0 ${
                    draftColor === c ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STICKER PICKER SUB-MODAL */}
      {stickerPickerMode && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xl flex flex-col justify-between p-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-sm font-bold text-white capitalize">Add {stickerPickerMode} Sticker</span>
            <button
              type="button"
              onClick={() => setStickerPickerMode(null)}
              className="p-1.5 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
            {stickerPickerMode === 'emoji' ? (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 text-3xl">
                {['🔥', '❤️', '✨', '⚡', '🎉', '🚀', '😍', '😂', '👏', '💯', '🌸', '🌊', '🌟', '🎧', '📸', '💎'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => handleAddSticker('emoji', em)}
                    className="p-3 rounded-2xl hover:bg-white/20 transition-transform active:scale-125 cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            ) : stickerPickerMode === 'mention' ? (
              <div className="w-full max-w-sm space-y-3">
                <p className="text-xs text-white/70">Pick a friend to mention:</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {allUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleAddSticker('mention', `@${u.username}`, { userId: u.id, username: u.username })}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 cursor-pointer text-white"
                    >
                      <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" isVerified={u.isVerified} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{u.displayName}</p>
                        <p className="text-[11px] text-white/60 truncate">@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Location or Hashtag text input */
              <div className="w-full max-w-sm space-y-3">
                <input
                  type="text"
                  value={stickerInputText}
                  onChange={(e) => setStickerInputText(e.target.value)}
                  placeholder={stickerPickerMode === 'location' ? 'Enter location (e.g. Tokyo, Berlin)...' : 'Enter hashtag (e.g. #art, #vibes)...'}
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (stickerInputText.trim()) {
                      handleAddSticker(
                        stickerPickerMode,
                        stickerPickerMode === 'hashtag' && !stickerInputText.startsWith('#')
                          ? `#${stickerInputText.trim()}`
                          : stickerInputText.trim()
                      );
                    }
                  }}
                  disabled={!stickerInputText.trim()}
                  className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold disabled:opacity-40"
                >
                  Add Sticker
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MUSIC SELECTOR MODAL */}
      <MusicSelectorModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectMusic={(track) => {
          setAttachedMusic(track);
          sounds.playPop();
        }}
        initialTrack={attachedMusic}
      />
    </div>
  );
}
