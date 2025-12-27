import React, { useRef, useEffect, useState } from 'react';
import ChatInput from './chat/ChatInput';
import MessageItem from './chat/MessageItem';
import CreatePollModal from './chat/CreatePollModal';
import ForwardModal from './chat/ForwardModal';
import DeleteModal from './chat/DeleteModal';
import MembersModal from './MembersModal'; 
import ThemePicker, { THEMES, DOODLE_PATTERN } from './chat/ThemePicker'; // NEW IMPORT
import useChatLogic from '../hooks/useChatLogic';
import { Lock, Unlock, Pin, X, AlertCircle, CheckCircle2, Search, Star, ArrowDown, Trash2, Users, Palette } from 'lucide-react'; 
import { database } from '../firebase';
import { ref, remove } from 'firebase/database';
import MeetingModal from './MeetingModal'; // <--- NEW IMPORT
import { Video } from 'lucide-react'; // <--- Ensure Video icon is imported

export default function ChatWindow({ activeGroup, currentUser, userData }) {
  const {
    messages, pinnedMessage, isRestricted, isManager, userProfiles, starredMessages,
    replyTo, setReplyTo, editingMessage, setEditingMessage,
    msgToDelete, setMsgToDelete, msgToForward, setMsgToForward,
    showPollModal, setShowPollModal,
    handleSendMessage, handleFileUpload, handleSendAudio, 
    handleCreatePoll, 
    handleVote, handleReveal, handleReaction, handleDeleteClick, confirmDeleteAction, handleForwardAction,
    handlePin, handleUnpin, toggleRestriction, handleStarMessage,
    typingUsers,       
  handleTypingStatus, 
    lastViewed, unreadCount, markAsRead
  } = useChatLogic(activeGroup, currentUser, userData);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [showMeeting, setShowMeeting] = useState(false); // <--- Add this
  
  const [toast, setToast] = useState(null); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // --- NEW: THEME STATE ---
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemePicker, setShowThemePicker] = useState(false);
  
  // Rater Logic
  const isRater = userData?.role === 'rater';

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleDeleteGroup = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete this group and all messages.")) return;
    if (!window.confirm("This action cannot be undone. Delete group?")) return;

    try {
      await remove(ref(database, `groups/${activeGroup.id}`));
      showToast("Group deleted successfully", 'success');
    } catch (error) {
      console.error("Error deleting group:", error);
      showToast("Failed to delete group", 'error');
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottom(isNotAtBottom);

    if (!isNotAtBottom && unreadCount > 0) {
        markAsRead();
    }
  };

  useEffect(() => {
    if (!showStarredOnly && !searchTerm) {
        if (!showScrollBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }
  }, [messages.length, activeGroup, showScrollBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    markAsRead(); 
  };

  const scrollToMessage = (msgId) => {
    const element = document.getElementById(msgId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-blue-200', 'transition-colors', 'duration-1000');
      setTimeout(() => element.classList.remove('bg-blue-200'), 1500);
    } else {
        showToast("Message not found (It may have been deleted)", "error");
    }
  };

  const onPollSubmit = (pollData) => {
      handleCreatePoll(pollData);
      setShowPollModal(false);
  };

  const renderMessages = () => {
    let hasShownUnreadSeparator = false;

    const filtered = messages.filter(msg => {
        const matchesSearch = msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              msg.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
        const isStarred = starredMessages && starredMessages[msg.id];
        if (showStarredOnly) return isStarred && matchesSearch;
        return matchesSearch;
    });

    if (filtered.length === 0) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 relative z-10">
                <div className="p-4 bg-white/50 backdrop-blur rounded-full shadow-sm">
                    {showStarredOnly ? <Star size={32} /> : <Search size={32} />}
                </div>
                <p className="text-sm font-medium bg-white/50 px-3 py-1 rounded-full">
                    {showStarredOnly ? "No starred messages found." : (searchTerm ? `No results for "${searchTerm}"` : "No messages yet.")}
                </p>
            </div>
        );
    }

    return filtered.map((msg, index) => {
        let showDivider = false;
        if (!hasShownUnreadSeparator && !isSearching && !showStarredOnly && lastViewed > 0) {
            if (msg.createdAt > lastViewed && msg.senderId !== currentUser.uid) {
                showDivider = true;
                hasShownUnreadSeparator = true;
            }
        }

        // --- NEW: MESSAGE GROUPING LOGIC ---
        // 1. Get previous message
        const prevMsg = index > 0 ? filtered[index - 1] : null;
        
        // 2. Check if current message should be grouped with previous
        // Conditions: Same Sender, Previous msg exists, No "Unread Divider" between them
        const isSequence = prevMsg && prevMsg.senderId === msg.senderId && !showDivider;
        
        // 3. We only show the Avatar/Name for the FIRST message in a sequence
        const showAvatar = !isSequence;

        return (
            <React.Fragment key={msg.id}>
                {showDivider && (
                    <div className="flex items-center justify-center my-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full border border-red-100 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            Unread Messages
                        </div>
                    </div>
                )}

                <MessageItem 
                    msg={msg} 
                    currentUser={currentUser} 
                    userData={userData}
                    isManager={isManager}
                    userProfiles={userProfiles}
                    onPin={handlePin}
                    onReply={setReplyTo}
                    onReact={handleReaction}
                    onDelete={handleDeleteClick}
                    onEdit={setEditingMessage} 
                    onVote={handleVote}
                    onReveal={handleReveal}
                    onForward={setMsgToForward}
                    onReplyClick={scrollToMessage} 
                    onStar={handleStarMessage}
                    isStarred={starredMessages && starredMessages[msg.id]}
                    searchTerm={searchTerm} 
                    // PASS GROUPING PROPS
                    isSequence={isSequence}
                    showAvatar={showAvatar}
                />
            </React.Fragment>
        );
    });
  };

  if (!activeGroup) return (
    <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-4 bg-[#E3F2FD]">
      <div className="w-16 h-16 bg-blue-200 rounded-full animate-pulse"></div>
      <p className="text-blue-400 font-bold">Select a group to start chatting</p>
    </div>
  );

  return (
    // NEW: Apply Theme Background + Transition
    <div className={`flex flex-col h-full ${THEMES[currentTheme].bg} relative overflow-hidden rounded-3xl shadow-xl border border-white/50 transition-colors duration-500`}>
      
      {/* NEW: Doodle Background Pattern */}
      <div 
         className={`absolute inset-0 pointer-events-none ${THEMES[currentTheme].pattern}`} 
         style={{ backgroundImage: DOODLE_PATTERN, backgroundSize: '120px' }}
      ></div>

      {!isRater && (
        <MembersModal 
            isOpen={showMembers} 
            onClose={() => setShowMembers(false)}
            activeGroup={activeGroup}
            currentUser={currentUser}
            userProfiles={userProfiles}
            isManager={isManager}
            userData={userData} 
        />
        
      )}

      {/* MEETING MODAL (Separate Section) */}
<MeetingModal 
    isOpen={showMeeting}
    onClose={() => setShowMeeting(false)}
    groupId={activeGroup.id}
    groupName={activeGroup.name}
    currentUser={currentUser}
/>

      {toast && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
        </div>
      )}

      {/* HEADER: Updated with Glassmorphism (bg-white/80 backdrop-blur-md) */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-3 flex justify-between items-center shadow-sm z-30 border-b border-gray-100 relative h-16 transition-all">
        <div className="flex-1 relative h-full flex items-center overflow-hidden">
            <div 
                onClick={() => !isRater && setShowMembers(true)}
                className={`absolute left-0 w-full transition-all duration-300 ease-in-out transform ${!isRater ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${isSearching ? 'translate-y-12 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
            >
                <h2 className="font-bold text-gray-800 text-lg leading-tight truncate">{activeGroup.name}</h2>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    {!isRater && (
                        <>
                            <span className="text-green-600 font-medium">{Object.keys(activeGroup.members || {}).length} members</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        </>
                    )}
                    <span>{messages.length} messages</span>
                    {isRestricted && <span className="text-red-600 bg-red-50 px-2 rounded-full border border-red-100 font-bold text-[10px] uppercase">Restricted</span>}
                </div>
            </div>

            <div className={`absolute left-0 w-full transition-all duration-300 ease-in-out transform ${isSearching ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
                <div className="relative w-full max-w-lg">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        autoFocus={isSearching}
                        className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all border border-transparent placeholder-gray-400"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => { setIsSearching(false); setSearchTerm(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full text-gray-500"><X size={14} /></button>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
            {!isSearching && <button onClick={() => setIsSearching(true)} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition active:scale-95"><Search size={20} /></button>}
            
            {!isRater && (
                <button 
                    onClick={() => setShowMembers(true)}
                    className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition active:scale-95 hidden md:block"
                    title="View Members"
                >
                    <Users size={20} />
                </button>
            )}

            {/* NEW: THEME PICKER BUTTON */}
            <div className="relative">
                <button 
                    onClick={() => setShowThemePicker(!showThemePicker)} 
                    className={`p-2.5 rounded-full transition active:scale-95 ${showThemePicker ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <Palette size={20} />
                </button>
                
                {/* Theme Component */}
                <ThemePicker 
                    isOpen={showThemePicker} 
                    onClose={() => setShowThemePicker(false)}
                    currentTheme={currentTheme}
                    onSelectTheme={(theme) => { setCurrentTheme(theme); setShowThemePicker(false); }}
                />
            </div>

            {/* VIDEO MEETING BUTTON */}
<button 
    onClick={() => setShowMeeting(true)}
    className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition active:scale-95 hidden md:block"
    title="Start Voice/Video Meeting"
>
    <Video size={20} />
</button>

            <button onClick={() => setShowStarredOnly(!showStarredOnly)} className={`p-2.5 rounded-full transition active:scale-95 ${showStarredOnly ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}><Star size={20} fill={showStarredOnly ? "currentColor" : "none"} /></button>
            
            {isManager && (
                <button 
                    onClick={toggleRestriction}
                    className={`p-2 rounded-full transition-all duration-200 ${
                    isRestricted 
                        ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title={isRestricted ? "Unrestrict Group" : "Restrict Group"}
                >
                    {isRestricted ? <Lock size={20} /> : <Unlock size={20} />}
                </button>
            )}

            {userData?.role === 'admin' && (
                <button 
                    onClick={handleDeleteGroup}
                    className="p-2 ml-1 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all active:scale-90"
                    title="Delete Group Permanently"
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>
      </div>

      {pinnedMessage && !showStarredOnly && !searchTerm && (
        <div onClick={() => scrollToMessage(pinnedMessage.id)} className="bg-gradient-to-r from-blue-50/95 to-white/90 backdrop-blur-md border-b border-blue-100 border-l-4 border-l-blue-500 px-4 py-2 flex justify-between items-center cursor-pointer hover:from-blue-100/90 hover:to-white transition-all z-20 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Pin size={14} fill="currentColor" /></div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Pinned Message</span>
                <span className="text-xs text-gray-700 truncate font-medium">{pinnedMessage.text}</span>
            </div>
          </div>
          {isManager && <button onClick={(e) => { e.stopPropagation(); handleUnpin(); }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"><X size={14} /></button>}
        </div>
      )}

      {/* MESSAGES AREA (Z-Index ensures messages float above doodle pattern) */}
      <div 
        ref={chatContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 scroll-smooth relative z-10"
      >
        {renderMessages()}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {showScrollBottom && (
         <button 
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 z-40 bg-white text-blue-600 shadow-xl border border-blue-100 p-2 rounded-full flex items-center gap-2 animate-in slide-in-from-bottom-5 hover:scale-105 transition active:scale-95 group"
         >
             <ArrowDown size={20} className={unreadCount > 0 ? "animate-bounce" : ""} />
             {unreadCount > 0 && (
                <span className="bg-red-50 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                    {unreadCount}
                </span>
             )}
         </button>
      )}

      {/* TYPING INDICATOR BUBBLE */}
{typingUsers.length > 0 && (
<div className="absolute bottom-28 left-6 z-50 bg-white/90 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 animate-in slide-in-from-bottom-2">        <div className="flex gap-0.5 mt-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <span className="text-xs font-medium text-gray-500">
            {typingUsers.length > 2 
                ? "Several people are typing..." 
                : `${typingUsers.join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`}
        </span>
    </div>
)}

      <ChatInput 
        onSendMessage={handleSendMessage} 
        onSendAudio={handleSendAudio}
        onUploadFile={handleFileUpload}
        onOpenPoll={() => setShowPollModal(true)}
        replyTo={replyTo} 
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        isRestricted={isRestricted}
        isManager={isManager}
        activeGroupId={activeGroup.id}
        onTyping={handleTypingStatus}
      />

      <CreatePollModal 
        isOpen={showPollModal} 
        onClose={() => setShowPollModal(false)} 
        onCreate={onPollSubmit} 
      />
      <DeleteModal isOpen={!!msgToDelete} onClose={() => setMsgToDelete(null)} onConfirm={confirmDeleteAction} />
      <ForwardModal isOpen={!!msgToForward} onClose={() => setMsgToForward(null)} onForward={handleForwardAction} currentUser={currentUser} />
    </div>
  );
}