import React from 'react';
import useChatLogic from '../hooks/useChatLogic'; // Import the Hook

import ChatHeader from './chat/ChatHeader';
import PinnedMessageBanner from './chat/PinnedMessageBanner';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import DeleteModal from './chat/DeleteModal';
import CreatePollModal from './chat/CreatePollModal';
import ForwardModal from './chat/ForwardModal';

export default function ChatWindow({ activeGroup, currentUser, userData }) {
  
  // Use the Custom Hook to get all logic
  const {
    messages, pinnedMessage, isRestricted, isManager,
    userProfiles, // Live User Data
    replyTo, setReplyTo,
    editingMessage, setEditingMessage,
    msgToDelete, setMsgToDelete,
    msgToForward, setMsgToForward,
    showPollModal, setShowPollModal,
    isUploading, // <--- NEW: Get Uploading State
    
    // Actions
    handleSendMessage, handleSendAudio, handleCreatePoll, handleVote, handleReveal,
    handleReaction, handleDeleteClick, confirmDeleteAction, handleForwardAction,
    handleFileUpload, // <--- NEW: Get File Upload Handler
    handlePin, handleUnpin, toggleRestriction
  } = useChatLogic(activeGroup, currentUser, userData);

  if (!activeGroup) {
    return (
      <div className="h-full bg-white rounded-3xl shadow-lg flex items-center justify-center text-gray-400 flex-col gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-2xl">💬</span></div>
        <p>Select a group from the left to start chatting</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] h-full rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
       </div>

      <ChatHeader 
        groupName={activeGroup.name} 
        groupId={activeGroup.id}
        isRestricted={isRestricted}
        isManager={isManager}
        onToggleRestriction={toggleRestriction}
        userXP={userData?.xp || 0}
      />

      <PinnedMessageBanner 
        message={pinnedMessage} 
        onUnpin={handleUnpin} 
        canUnpin={isManager} 
      />

      <MessageList 
        messages={messages} 
        currentUser={currentUser} 
        userData={userData}
        isManager={isManager} 

        // --- PROPS FOR FEATURES ---
        activeGroup={activeGroup}   
        userProfiles={userProfiles} 

        onPinMessage={handlePin}
        onReply={(msg) => setReplyTo(msg)}
        onReact={handleReaction}
        onDelete={handleDeleteClick}
        onEdit={(msg) => setEditingMessage(msg)}
        onVote={handleVote}
        onReveal={handleReveal}
        onForward={(msg) => setMsgToForward(msg)}
      />

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isRestricted={isRestricted} 
        isManager={isManager}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        activeGroupId={activeGroup.id}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onOpenPoll={() => setShowPollModal(true)}
        onSendAudio={handleSendAudio} 
        
        // --- MEDIA UPLOAD PROPS ---
        onUploadFile={handleFileUpload} 
        isUploading={isUploading}
        
        userXP={userData?.xp || 0}
      />

      <DeleteModal 
        isOpen={!!msgToDelete}
        onClose={() => setMsgToDelete(null)}
        onConfirm={confirmDeleteAction}
      />

      <CreatePollModal 
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreate={handleCreatePoll}
      />

      <ForwardModal 
        isOpen={!!msgToForward}
        onClose={() => setMsgToForward(null)}
        onForward={handleForwardAction}
      />
      
    </div>
  );
}