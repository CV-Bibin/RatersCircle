import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

export default function VoiceMessage({ msg, isMe, nameTextColor, canSeeDeletedContent }) {
  const isDeleted = msg.isDeleted;
  
  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Formatting Time (mm:ss)
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- SAFE PLAY FUNCTION ---
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            await audio.play();
        }
    } catch (error) {
        console.error("Playback interrupted:", error);
        setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleLoadedMetadata = () => {
      if(audioRef.current) {
          setDuration(audioRef.current.duration);
      }
  }

  // --- RENDERING ---

  // 1. If Deleted (Standard View)
  if (isDeleted && !canSeeDeletedContent) {
    return (
        <div className="bg-gray-100 border border-gray-200 p-3 rounded-2xl flex items-center gap-2 min-w-[200px]">
             <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <Trash2 size={14} /> 
             </div>
             <p className="text-xs text-gray-400 italic">
                {['admin', 'leader', 'co_admin'].includes(msg.deletedByRole)
                    ? `Deleted by ${msg.deletedByRole}`
                    : "Voice note deleted"
                }
             </p>
        </div>
    );
  }

  // 2. Active Audio (or Admin View of Deleted)
  return (
    <div className={`relative p-3 shadow-sm rounded-2xl min-w-[240px] border border-transparent transition-all
        ${isDeleted 
          ? 'bg-red-50 border-red-100' // Admin deleted view style
          : isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'}`
    }>
       {/* Hidden Native Audio Element */}
       {/* FIX: Changed msg.audioUrl -> msg.mediaUrl to match your DB logic */}
       <audio 
         ref={audioRef} 
         src={msg.mediaUrl} 
         onTimeUpdate={handleTimeUpdate}
         onEnded={handleEnded}
         onLoadedMetadata={handleLoadedMetadata}
         className="hidden"
       />

       <div className="flex items-center gap-3">
          
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm shrink-0
              ${isMe && !isDeleted 
                 ? 'bg-white/20 text-white hover:bg-white/30' 
                 : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Waveform / Progress Area */}
          <div className="flex-1 flex flex-col gap-1 justify-center">
              
              {/* Name (if group chat) */}
              {!isMe && !isDeleted && (
                 <p className={`text-[10px] font-bold ${nameTextColor} leading-none mb-0.5`}>
                    {msg.senderEmail.split('@')[0]}
                 </p>
              )}

              {/* FAKE WAVEFORM VISUALIZATION */}
              <div className="relative h-6 w-full flex items-center gap-[2px] opacity-80">
                 {/*  */}
                 {[...Array(25)].map((_, i) => {
                    // Create a random-looking pattern that is static
                    const height = [40, 60, 100, 50, 30, 70, 90, 40, 60, 80, 40, 60, 100, 50, 30, 70, 90, 40, 60, 80, 50, 30, 60, 40, 50][i] || 50;
                    
                    // Logic to "fill" the bars as time progresses
                    const isPlayed = (i / 25) * 100 < progress;
                    
                    return (
                        <div 
                           key={i} 
                           className={`w-1 rounded-full transition-all duration-200 ${isPlayed ? (isMe && !isDeleted ? 'bg-white' : 'bg-blue-500') : (isMe && !isDeleted ? 'bg-white/40' : 'bg-gray-200')}`}
                           style={{ height: `${height}%` }}
                        />
                    );
                 })}
              </div>

              {/* Time Display */}
              <div className={`text-[10px] font-medium flex justify-between w-full ${isMe && !isDeleted ? 'text-blue-100' : 'text-gray-400'}`}>
                 <span>{formatTime(currentTime)}</span>
                 <span>{formatTime(duration)}</span>
              </div>
          </div>
       </div>

       {/* Admin "Deleted" Label Overlay */}
       {isDeleted && canSeeDeletedContent && (
          <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-red-200 shadow-sm">
             Deleted (Admin View)
          </div>
       )}
    </div>
  );
}