import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

export default function MessageList({ 
  messages, 
  currentUser, 
  userData, 
  isManager, 
  activeGroup, 
  userProfiles, // <--- 1. NEW: Receive Live User Data
  onPinMessage, 
  onReply, 
  onReact, 
  onDelete, 
  onEdit, 
  onVote, 
  onReveal, 
  onForward 
}) {
  const messagesEndRef = useRef(null);

  // --- PERMISSION CHECK (USING LIVE DATA) ---
  // If userProfiles exists, use the live XP. Otherwise fall back to snapshot.
  const myLiveXP = userProfiles?.[currentUser.uid]?.xp || userData?.xp || 0;
  
  // If not a manager AND XP < 100, you are a "First Level Rater"
  const isFirstLevelRater = !isManager && myLiveXP < 100;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto pb-32">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          msg={msg}
          currentUser={currentUser}
          userData={userData}
          isManager={isManager}
          isFirstLevelRater={isFirstLevelRater}
          
          // --- PASS LIVE DATA DOWN ---
          groupMembers={activeGroup?.members || {}} 
          userProfiles={userProfiles} // <--- 2. Pass this to Item for XP Rings
          
          // --- ACTIONS ---
          onPin={onPinMessage}
          onReply={onReply}
          onReact={onReact}
          onDelete={onDelete}
          onEdit={onEdit}
          onVote={onVote}
          onReveal={onReveal}
          onForward={onForward} 
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}