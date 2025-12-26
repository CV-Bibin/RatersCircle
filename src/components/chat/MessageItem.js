import React, { useState } from 'react';
import { Pin, Reply, Smile, Trash2, Edit2, Clock, Share, CheckCheck } from 'lucide-react';
import PollMessage from './PollMessage';
import VoiceMessage from './VoiceMessage';
import AnimeDP from "../images/AnimeDP";

export default function MessageItem({ 
  msg, 
  currentUser, 
  userData, 
  isManager, 
  isFirstLevelRater, 
  groupMembers, 
  userProfiles, // <--- Receive Live Data for XP Rings
  onPin, 
  onReply, 
  onReact, 
  onDelete, 
  onEdit, 
  onVote, 
  onReveal,
  onForward 
}) {
  const [showReactionMenu, setShowReactionMenu] = useState(false);

  const isMe = msg.senderId === currentUser.uid;
  const isDeleted = msg.isDeleted;
  const myRole = userData?.role;
  const canSeeDeletedContent = myRole === 'admin';
  const showEditHistory = myRole === 'admin' && msg.editHistory && !isDeleted;
  
  // --- LIVE DATA LOGIC ---
  // If we have live profiles, use them. Otherwise fallback to message snapshot.
  const senderLiveProfile = userProfiles ? userProfiles[msg.senderId] : null;
  const currentXP = isMe ? (userData?.xp || 0) : (senderLiveProfile?.xp || msg.senderXp || 0);
  const currentRole = isMe ? (userData?.role) : (senderLiveProfile?.role || msg.senderRole);

  // --- NAME MASKING LOGIC ---
  const getDisplayName = () => {
    if (!isFirstLevelRater && !isManager) return msg.senderEmail.split('@')[0];
    if (isManager) return msg.senderEmail.split('@')[0];
    
    // Use currentRole for masking
    if (currentRole === 'admin') return "Admin";
    if (currentRole === 'co_admin' || currentRole === 'assistant_admin') return "Task Expert";
    if (currentRole === 'leader' || currentRole === 'group_leader') return msg.senderEmail.split('@')[0];
    
    return "Member";
  };

  const displayName = isMe ? "You" : getDisplayName();

  // --- ROLE COLORS ---
  const getRoleTextColor = (role) => {
    switch (role) {
      case 'admin': return 'text-gray-900';
      case 'co_admin': return 'text-amber-700';
      case 'assistant_admin': return 'text-yellow-600';
      case 'leader': return 'text-purple-700';
      case 'group_leader': return 'text-orange-600';
      case 'rater': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  // --- TICK LOGIC (VISIBILITY FIXED) ---
  const getStatusIcon = () => {
     if (!isMe) return null; 

     const readByIDs = msg.readBy ? Object.keys(msg.readBy).filter(id => id !== currentUser.uid) : [];
     const readCount = readByIDs.length;
     const totalMemberIDs = groupMembers ? Object.keys(groupMembers).filter(id => id !== currentUser.uid) : [];
     const totalCount = totalMemberIDs.length;

     // 1. READ BY EVERYONE (Bright Green)
     if (totalCount > 0 && readCount >= totalCount) {
        return <CheckCheck size={15} className="text-green-300 drop-shadow-sm" strokeWidth={2.5} />;
     } 
     // 2. READ BY SOMEONE (Bright Ice Blue)
     else if (readCount > 0) {
        return <CheckCheck size={15} className="text-sky-200 drop-shadow-sm" strokeWidth={2.5} />;
     } 
     // 3. DELIVERED (Faint White/Blue)
     else {
        return <CheckCheck size={15} className="text-blue-200/60" />;
     }
  };

  // --- PERMISSIONS ---
  let canDelete = false;
  if (isManager) canDelete = true;
  else if (isMe && (userData?.xp || 0) >= 100) canDelete = true;

  const canEdit = isMe && !isDeleted && msg.type !== 'poll' && msg.type !== 'audio';
  const reactions = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥'];

  return (
    <div className={`flex gap-3 mb-6 group ${isMe ? 'flex-row-reverse' : ''}`}>
      
      {/* AVATAR */}
      <div className="shrink-0">
        <AnimeDP 
          seed={msg.senderEmail || msg.senderId} 
          role={currentRole} 
          size={45} 
          xp={currentXP} 
        />
      </div>

      <div className="max-w-[75%] relative">
        
        {/* CONTENT */}
        {msg.type === 'poll' ? (
          <PollMessage msg={msg} currentUser={currentUser} onVote={onVote} onReveal={onReveal} />
        ) : msg.type === 'audio' ? (
          <VoiceMessage msg={msg} isMe={isMe} nameTextColor={getRoleTextColor(currentRole)} canSeeDeletedContent={canSeeDeletedContent} />
        ) : (
          <>
            {msg.replyTo && !isDeleted && (
              <div className={`text-xs mb-1 p-2 rounded-lg border-l-4 bg-white/50 border-gray-400 text-gray-500 opacity-80 ${isMe ? 'text-right' : 'text-left'}`}>
                <span className="font-bold block mb-0.5">
                   {isFirstLevelRater && !isManager && !isMe ? "Member/Admin" : msg.replyTo.sender}
                </span>
                <span className="italic truncate block">{msg.replyTo.text}</span>
              </div>
            )}

            <div className={`relative p-4 shadow-sm break-words ${isDeleted ? 'bg-gray-100 border border-gray-200 text-gray-400 rounded-2xl italic' : isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'}`}>
              {!isMe && !isDeleted && (
                <p className={`text-[11px] mb-1 font-bold ${getRoleTextColor(currentRole)}`}>
                  {displayName}
                </p>
              )}

              {isDeleted ? (
                <div>
                  <p className="text-xs flex items-center gap-1">
                    <Trash2 size={12} /> {msg.deletedByRole === 'admin' ? "Deleted by Admin" : "Message deleted"}
                  </p>
                  {canSeeDeletedContent && (
                    <div className="mt-2 pt-2 border-t border-gray-300 text-red-500 text-xs not-italic font-medium">
                      (Admin View): {msg.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  {/* METADATA ROW */}
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'} opacity-90`}>
                      {msg.isEdited && <span className="text-[9px] mr-1 opacity-70">(edited)</span>}
                      <span className="text-[9px] opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {/* TICKS */}
                      {isMe && <div className="ml-1 translate-y-[1px]">{getStatusIcon()}</div>}
                  </div>

                  {showEditHistory && (
                    <div className="mt-3 pt-2 border-t border-black/10 text-left">
                      <p className="text-[9px] font-bold text-gray-500 flex items-center gap-1 mb-1"><Clock size={10} /> Edit History:</p>
                      {Object.entries(msg.editHistory).map(([ts, oldText]) => (
                        <div key={ts} className="text-[9px] text-gray-500 mb-0.5 opacity-80"><span className="line-through mr-1">{oldText}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* REACTIONS & ACTIONS */}
        {!isDeleted && (
          <>
            {msg.reactions && (
              <div className={`absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} flex gap-1 z-10`}>
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <div key={emoji} className="bg-white/90 backdrop-blur border border-gray-100 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1 scale-90">
                    <span>{emoji}</span><span className="font-bold text-gray-500">{Object.keys(users).length}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`absolute -top-3 ${isMe ? '-left-24' : '-right-24'} flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200 z-20`}>
              
              <button onClick={() => onForward(msg)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-purple-500 hover:scale-110 transition" title="Forward">
                <Share size={14} />
              </button>

              {canDelete && (
                <button onClick={() => onDelete(msg)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:scale-110 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              )}

              {canEdit && (
                <button onClick={() => onEdit(msg)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-green-500 hover:scale-110 transition" title="Edit">
                  <Edit2 size={14} />
                </button>
              )}

              {isManager && (
                <button onClick={() => onPin(msg)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-yellow-500 hover:scale-110 transition" title="Pin">
                  <Pin size={14} />
                </button>
              )}

              {msg.type !== 'poll' && (
                <button onClick={() => onReply(msg)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-blue-500 hover:scale-110 transition" title="Reply">
                  <Reply size={14} />
                </button>
              )}

              <div className="relative">
                <button onClick={() => setShowReactionMenu(!showReactionMenu)} className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-orange-500 hover:scale-110 transition">
                  <Smile size={14} />
                </button>
                {showReactionMenu && (
                  <div className="absolute top-8 left-0 bg-white shadow-xl rounded-full p-1 flex gap-1 border border-gray-100 z-50 animate-in zoom-in-50 duration-200">
                    {reactions.map(emoji => (
                      <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowReactionMenu(false); }} className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-lg transition">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}