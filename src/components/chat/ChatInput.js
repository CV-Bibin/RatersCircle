import React, { useState, useEffect, useRef } from 'react';
// 1. UPDATE: Added 'Smile' icon import
import { Send, Lock, X, Edit2, BarChart2, Mic, Plus, Smile } from 'lucide-react';
import { database, auth } from '../../firebase';
import { ref, update } from 'firebase/database';
import AttachmentMenu from './AttachmentMenu';
// 2. UPDATE: Import StickerPicker
import StickerPicker from './StickerPicker';


export default function ChatInput({ 
  onSendMessage, isRestricted, isManager, 
  onTyping, 
  replyTo, onCancelReply, 
  activeGroupId,
  editingMessage, onCancelEdit,
  onOpenPoll,
  onSendAudio,
  onUploadFile, 
  userXP = 0 
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // 3. UPDATE: New State for Sticker Menu
  const [showStickers, setShowStickers] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  

  const canCreatePoll = isManager || userXP >= 500; 

  const getReplyDisplayName = () => {
    if (!replyTo) return "";
    if (isManager || userXP >= 100) return replyTo.senderEmail?.split('@')[0];
    const role = replyTo.senderRole;
    if (role === 'admin') return "Admin";
    if (role === 'co_admin' || role === 'assistant_admin') return "Task Expert";
    return replyTo.senderEmail?.split('@')[0] || "Member";
  };

  useEffect(() => {
    if (editingMessage) setNewMessage(editingMessage.text);
    else setNewMessage("");
  }, [editingMessage]);

  // --- EXISTING "STATUS" TYPING LOGIC (Global Profile Status) ---
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

  // --- UPDATED TYPING HANDLER ---
  const handleTyping = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    // A. Trigger Existing Status Logic (Global)
    if (!isTyping && activeGroupId) {
      setIsTyping(true);
      update(ref(database, `status/${auth.currentUser.uid}`), { typingIn: activeGroupId });
    }

    // B. Trigger New Group Typing Logic (Chat Window Indicator)
    if (onTyping) {
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    }
  };


// ✅ NEW: ROBUST PASTE HANDLER (Checks Files AND Screenshots)
const handlePaste = (e) => {
  console.log("Paste detected!"); 

  // 1. Check if user copied a File directly (e.g. from Desktop)
  if (e.clipboardData.files && e.clipboardData.files.length > 0) {
    const file = e.clipboardData.files[0];
    if (file.type.startsWith('image/')) {
      console.log("Pasting File:", file.name);
      e.preventDefault();
      onUploadFile(file);
      return;
    }
  }

  // 2. Check if user pasted "Data" (e.g. Screenshot or Right-click > Copy Image)
  if (e.clipboardData.items) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          console.log("Pasting Screenshot");
          e.preventDefault();
          onUploadFile(file);
          return;
        }
      }
    }
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
    
    if (onTyping) {
        onTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    onSendMessage(newMessage);
    setNewMessage("");
  };

  const canType = !isRestricted || isManager;

  return (
    <div className="w-full z-30 p-4 bg-[#f0f2f5] border-t border-gray-200 relative">
      
      {/* --- ATTACHMENT MENU --- */}
      <AttachmentMenu 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        onSelect={onUploadFile} 
      />

      {/* --- 4. UPDATE: STICKER PICKER COMPONENT --- */}
      <StickerPicker 
        isOpen={showStickers} 
        onClose={() => setShowStickers(false)} 
        onSelect={(sticker) => {
            onSendMessage(sticker); 
            setShowStickers(false);
        }} 
      />

      {replyTo && (
        <div className="flex justify-between items-center bg-white p-3 rounded-t-2xl border border-b-0 border-gray-200 shadow-sm mb-[-1px] mx-2">
          <div className="text-xs text-gray-600 border-l-2 border-blue-500 pl-2">
            <span className="font-bold text-blue-600 block">Replying to {getReplyDisplayName()}</span>
            <span className="truncate block max-w-xs opacity-75">{replyTo.text}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={14} /></button>
        </div>
      )}

      {editingMessage && (
        <div className="flex justify-between items-center bg-green-50 p-3 rounded-t-2xl border border-b-0 border-green-200 shadow-sm mb-[-1px] mx-2">
          <div className="text-xs text-green-700 flex items-center gap-2">
            <Edit2 size={14}/> <span className="font-bold">Editing Message...</span>
          </div>
          <button onClick={onCancelEdit} className="p-1 hover:bg-green-100 rounded-full text-green-600"><X size={14} /></button>
        </div>
      )}

      {canType ? (
        <form onSubmit={handleSubmit} className={`bg-white shadow-sm border border-gray-200 rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 ${replyTo || editingMessage ? 'rounded-t-none' : ''}`}>
          
          {!isRecording && (
            <>
                {/* --- PLUS BUTTON (Toggles Menu) --- */}
                <button 
                    type="button" 
                    onClick={() => setShowMenu(!showMenu)} 
                    className={`p-2 rounded-full transition ${showMenu ? 'bg-blue-100 text-blue-600 rotate-45' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                >
                    <Plus size={24} />
                </button>

                {/* --- 5. UPDATE: STICKER BUTTON --- */}
                <button 
                    type="button" 
                    onClick={() => setShowStickers(!showStickers)} 
                    className={`p-2 rounded-full transition ${showStickers ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                >
                    <Smile size={24} />
                </button>

                {canCreatePoll && (
                    <button type="button" onClick={onOpenPoll} className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition" title="Create Poll">
                        <BarChart2 size={20} />
                    </button>
                )}
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
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                placeholder={editingMessage ? "Update..." : "Type a message..."}
                value={newMessage}
                onChange={handleTyping} // Uses updated handler
                onPaste={handlePaste}
             />
          )}
          
          {newMessage.trim() || editingMessage ? (
             <button type="submit" className="p-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full transition shadow-md">
                {editingMessage ? <Edit2 size={18} /> : <Send size={18} />}
             </button>
          ) : (
             <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-full transition shadow-md ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {isRecording ? <Send size={18} fill="currentColor" /> : <Mic size={20} />}
             </button>
          )}
        </form>
      ) : (
        <div className="bg-red-50/90 backdrop-blur border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 shadow-sm">
          <Lock size={16} /> <span className="text-sm font-bold">Only Admins can send messages.</span>
        </div>
      )}
    </div>
  );
}