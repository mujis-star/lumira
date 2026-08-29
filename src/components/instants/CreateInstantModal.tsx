'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useInstants } from '@/context/InstantContext';
import { useAuth } from '@/context/AuthContext';
import { InstantEditor } from './InstantEditor';
import { ShareInstantSheet } from './ShareInstantSheet';
import { Modal } from '@/components/ui/Modal';
import {
  Upload,
  Camera,
  X,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { sounds } from '@/lib/utils';

interface CreateInstantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select' | 'edit' | 'share';

const SAMPLE_GALLERY_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    type: 'image' as const,
    label: 'Iridescent Waves',
  },
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1080&q=80',
    type: 'image' as const,
    label: 'Studio Portrait',
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    type: 'image' as const,
    label: 'Ocean Sunset',
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
    type: 'image' as const,
    label: 'Modern Architecture',
  },
];

interface EditorPayload {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filterId: string;
  filterIntensity: number;
  adjustments: import('@/lib/types').InstantAdjustments;
  textOverlays: import('@/lib/types').InstantOverlayText[];
  stickers: import('@/lib/types').InstantOverlaySticker[];
  drawingDataUrl?: string;
  attachedMusic?: import('@/lib/types').AttachedMusic;
  musicVolume: number;
  videoVolume: number;
  videoTrim?: { start: number; end: number };
  videoSpeed: number;
}

export function CreateInstantModal({ isOpen, onClose }: CreateInstantModalProps) {
  const { createInstant } = useInstants();
  const { allUsers } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>('image');

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const videoStreamRef = useRef<HTMLVideoElement>(null);
  const streamTrackRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor Payload State passing to Step 3
  const [editorPayload, setEditorPayload] = useState<EditorPayload | null>(null);

  // Stop camera on unmount or close
  const stopCameraStream = () => {
    if (streamTrackRef.current) {
      streamTrackRef.current.getTracks().forEach((track) => track.stop());
      streamTrackRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamTrackRef.current) {
        streamTrackRef.current.getTracks().forEach((track) => track.stop());
        streamTrackRef.current = null;
      }
    };
  }, []);

  const handleCloseModal = () => {
    stopCameraStream();
    setCurrentStep('select');
    setSelectedMediaUrl(null);
    setEditorPayload(null);
    onClose();
  };

  const handleStartCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false,
        });
        streamTrackRef.current = stream;
        if (videoStreamRef.current) {
          videoStreamRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } else {
        alert('Camera is not supported on this browser/device.');
      }
    } catch (err) {
      console.warn('Camera permission denied or unavailable:', err);
      alert('Camera access was not granted. You can still upload photos and videos from your device.');
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoStreamRef.current) return;
    const video = videoStreamRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedMediaUrl(dataUrl);
      setSelectedMediaType('image');
      stopCameraStream();
      setCurrentStep('edit');
      sounds.playCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedMediaUrl(event.target.result as string);
        setSelectedMediaType(isVideo ? 'video' : 'image');
        setCurrentStep('edit');
        sounds.playPop();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string, type: 'image' | 'video') => {
    setSelectedMediaUrl(url);
    setSelectedMediaType(type);
    setCurrentStep('edit');
    sounds.playPop();
  };

  const handleEditorContinue = (result: EditorPayload) => {
    setEditorPayload(result);
    setCurrentStep('share');
  };

  const handleFinalShare = (shareOptions: {
    visibility: import('@/lib/types').InstantVisibility;
    allowedViewerIds?: string[];
    caption?: string;
  }) => {
    if (!editorPayload) return;

    createInstant({
      mediaUrl: editorPayload.mediaUrl,
      mediaType: editorPayload.mediaType,
      filterId: editorPayload.filterId,
      filterIntensity: editorPayload.filterIntensity,
      adjustments: editorPayload.adjustments,
      textOverlays: editorPayload.textOverlays,
      stickers: editorPayload.stickers,
      drawingDataUrl: editorPayload.drawingDataUrl,
      attachedMusic: editorPayload.attachedMusic,
      musicVolume: editorPayload.musicVolume,
      videoVolume: editorPayload.videoVolume,
      videoTrim: editorPayload.videoTrim,
      videoSpeed: editorPayload.videoSpeed,
      caption: shareOptions.caption,
      visibility: shareOptions.visibility,
      allowedViewerIds: shareOptions.allowedViewerIds,
    });

    handleCloseModal();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* STEP 1: Select Media / Camera */}
      {currentStep === 'select' && (
        <Modal isOpen={isOpen} onClose={handleCloseModal} title="Create Instant" size="md">
          <div className="p-5 space-y-6 select-none bg-transparent">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Camera View Mode */}
            {isCameraActive ? (
              <div className="space-y-4">
                <div className="relative aspect-[9/16] max-h-[60vh] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/20">
                  <video
                    ref={videoStreamRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
                      setTimeout(handleStartCamera, 100);
                    }}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    title="Flip camera"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  {/* Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white" />
                  </button>

                  <div className="w-11" />
                </div>
              </div>
            ) : (
              /* Media Upload Options */
              <div className="space-y-5">
                {/* Hero Action Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-3xl bg-[var(--glass-card-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] hover:border-[var(--glass-border-highlight)] shadow-[var(--glass-shadow)] transition-all group cursor-pointer active:scale-98"
                  >
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Upload Media</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Photos & Videos</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-3xl bg-[var(--glass-card-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] hover:border-[var(--glass-border-highlight)] shadow-[var(--glass-shadow)] transition-all group cursor-pointer active:scale-98"
                  >
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Take Photo</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Use Camera</p>
                    </div>
                  </button>
                </div>

                {/* Preset Gallery Showcase */}
                <div className="space-y-2.5 pt-2 border-t border-[var(--glass-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Or pick from gallery
                    </span>
                    <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>24h Ephemeral</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SAMPLE_GALLERY_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPreset(preset.url, preset.type)}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--glass-border)] shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-102"
                      >
                        <Image
                          src={preset.url}
                          alt={preset.label}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] font-bold text-white truncate">
                            {preset.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* STEP 2: Advanced Instant Editor */}
      {currentStep === 'edit' && selectedMediaUrl && (
        <InstantEditor
          mediaUrl={selectedMediaUrl}
          mediaType={selectedMediaType}
          allUsers={allUsers}
          onCancel={() => {
            setCurrentStep('select');
            setSelectedMediaUrl(null);
          }}
          onContinue={handleEditorContinue}
        />
      )}

      {/* STEP 3: Share Instant Sheet & Final Preview */}
      {currentStep === 'share' && editorPayload && (
        <ShareInstantSheet
          mediaUrl={editorPayload.mediaUrl}
          mediaType={editorPayload.mediaType}
          filterId={editorPayload.filterId}
          filterIntensity={editorPayload.filterIntensity}
          adjustments={editorPayload.adjustments}
          textOverlays={editorPayload.textOverlays}
          stickers={editorPayload.stickers}
          drawingDataUrl={editorPayload.drawingDataUrl}
          attachedMusic={editorPayload.attachedMusic}
          musicVolume={editorPayload.musicVolume}
          videoVolume={editorPayload.videoVolume}
          videoTrim={editorPayload.videoTrim}
          videoSpeed={editorPayload.videoSpeed}
          allUsers={allUsers}
          onBack={() => setCurrentStep('edit')}
          onShare={handleFinalShare}
        />
      )}
    </>
  );
}
