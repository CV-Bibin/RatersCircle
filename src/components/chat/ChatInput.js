import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, X, Edit2, BarChart2, Mic } from 'lucide-react';
import { database, auth } from '../../firebase';
import { ref, update } from 'firebase/database';
import MediaUpload from './MediaUpload'; // <--- Import the new component

export default function ChatInput({ 
    onSendMessage, isRestricted, isManager, 
    replyTo, onCancelReply, 
    activeGroupId,
    editingMessage, onCancelEdit,
    onOpenPoll,
    onSendAudio,
    onUploadFile, // Passed from parent
    isUploading,  // Passed from parent
    userXP = 0 
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Ref for Audio only (File ref moved to MediaUpload.js)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // --- 1. POLL RESTRICTION LOGIC ---
  const canCreatePoll = isManager || userXP >= 500; 

  // --- 2. REPLY NAME MASKING ---
  const getReplyDisplayName = () => {
    if (!replyTo) return "";
    if (isManager || userXP >= 100) return replyTo.senderEmail?.split('@')[0];
    const role = replyTo.senderRole;
    if (role === 'admin') return "Admin";
    if (role === 'co_admin' || role === 'assistant_admin') return "Task Expert";
    if (role === 'leader' || role === 'group_leader') return replyTo.senderEmail?.split('@')[0]; 
    return "Member"; 
  };

  useEffect(() => {
    if (editingMessage) setNewMessage(editingMessage.text);
    else setNewMessage("");
  }, [editingMessage]);

  useEffect(() => {
    if (!auth.currentUser || !activeGroupId) return;
    const statusRef = ref(database, `status/${auth.currentUser.uid}`);
    const timer = setTimeout(() => {
      if (isTyping) {
        update(statusRef, { typingIn: null });
        setIsTyping(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [newMessage, activeGroupId, isTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && activeGroupId) {
      setIsTyping(true);
      update(ref(database, `status/${auth.currentUser.uid}`), { typingIn: activeGroupId });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendAudio(audioBlob); 
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null; 
        mediaRecorderRef.current.stop();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        audioChunksRef.current = []; 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    update(ref(database, `status/${auth.currentUser.uid}`), { typingIn: null });
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const canType = !isRestricted || isManager;

  return (
    <div className="absolute bottom-0 w-full z-30 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent">
      
      {replyTo && (
        <div className="flex justify-between items-center bg-white/90 backdrop-blur p-3 rounded-t-2xl border border-b-0 border-gray-200 mx-4 shadow-sm">
          <div className="text-xs text-gray-600 border-l-2 border-blue-500 pl-2">
            <span className="font-bold text-blue-600 block">Replying to {getReplyDisplayName()}</span>
            <span className="truncate block max-w-xs opacity-75">{replyTo.text}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={14} /></button>
        </div>
      )}

      {editingMessage && (
        <div className="flex justify-between items-center bg-green-50/90 backdrop-blur p-3 rounded-t-2xl border border-b-0 border-green-200 mx-4 shadow-sm">
          <div className="text-xs text-green-700 flex items-center gap-2">
            <Edit2 size={14}/> <span className="font-bold">Editing Message...</span>
          </div>
          <button onClick={onCancelEdit} className="p-1 hover:bg-green-100 rounded-full text-green-600"><X size={14} /></button>
        </div>
      )}

      {canType ? (
        <form onSubmit={handleSubmit} className={`bg-white shadow-xl border border-gray-100 rounded-full p-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 ${replyTo || editingMessage ? 'rounded-t-none rounded-b-3xl mx-4' : ''}`}>
          
          {!isRecording && (
            <>
                {canCreatePoll && (
                    <button type="button" onClick={onOpenPoll} className="p-3 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition" title="Create Poll">
                        <BarChart2 size={20} />
                    </button>
                )}
                
                {/* --- USE NEW MEDIA UPLOAD COMPONENT --- */}
                <MediaUpload 
                    onUpload={onUploadFile} 
                    isUploading={isUploading} 
                />
            </>
          )}
          
          {isRecording ? (
             <div className="flex-1 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-red-500">Recording...</span>
                </div>
                <button type="button" onClick={cancelRecording} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition text-xs font-bold flex items-center gap-1">
                    <X size={16} /> Cancel
                </button>
             </div>
          ) : (
             <input 
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 disabled:opacity-50"
                placeholder={isUploading ? "Uploading media..." : (editingMessage ? "Update..." : "Type a message...")}
                value={newMessage}
                onChange={handleTyping}
                disabled={isUploading}
             />
          )}
          
          {newMessage.trim() || editingMessage ? (
             <button type="submit" disabled={isUploading} className="p-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full transition shadow-md">
                {editingMessage ? <Edit2 size={18} /> : <Send size={18} />}
             </button>
          ) : (
             <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isUploading} className={`p-3 rounded-full transition shadow-md ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {isRecording ? <Send size={18} fill="currentColor" /> : <Mic size={20} />}
             </button>
          )}
        </form>
      ) : (
        <div className="bg-red-50/90 backdrop-blur border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 shadow-lg">
          <Lock size={16} /> <span className="text-sm font-bold">Only Admins can send messages here.</span>
        </div>
      )}
    </div>
  );
}