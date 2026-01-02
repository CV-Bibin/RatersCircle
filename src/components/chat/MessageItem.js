import React, { useState } from 'react';
import { Pin, Reply, Smile, Trash2, Edit2, Share, CheckCheck, Download, Eye, Play, FileText, File, Loader2, Star } from 'lucide-react';
import PollMessage from './PollMessage';
import VoiceMessage from './VoiceMessage';
import AnimeDP from "../images/AnimeDP";


const isAudioFile = (msg) => {
    if (!msg?.fileName) return false;
    return /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(msg.fileName);
};


// Helper: Checks if the message is JUST emojis (1 to 3 characters)
const isSingleSticker = (text) => {
    if (!text) return false;
    // Allow Pictographs, Emojis, Joiners (200D), and Variation Selectors (FE0F)
    const emojiRegex = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200D\uFE0F\s]{1,10}$/u;
    return emojiRegex.test(text.trim()) && !/[a-zA-Z0-9]/.test(text); // Double check no text
};





export default function MessageItem({
    msg, currentUser, userData, isManager, isFirstLevelRater, groupMembers, userProfiles,
    onPin, onReply, onReact, onDelete, onEdit, onVote, onReveal, onForward, onReplyClick,
    onStar, isStarred, searchTerm,
    // NEW PROPS FOR GROUPING
    isSequence,
    showAvatar
}) {
    const [showReactionMenu, setShowReactionMenu] = useState(false);

    const isMe = msg.senderId === currentUser.uid;
    const isDeleted = msg.isDeleted;
    const myRole = userData?.role;
    const isAdmin = myRole === 'admin';

    const senderLiveProfile = userProfiles ? userProfiles[msg.senderId] : null;
    const currentXP = isMe ? (userData?.xp || 0) : (senderLiveProfile?.xp || msg.senderXp || 0);
    const currentRole = isMe ? (userData?.role) : (senderLiveProfile?.role || msg.senderRole);



    // 👇 PASTE THIS START 👇
    const calculateStars = (role, xp) => {
        if (role !== 'rater') return 0;
        const safeXP = Number(xp || 0);
        if (safeXP >= 2500) return 3; // Legendary
        if (safeXP >= 1000) return 2; // Pro
        if (safeXP >= 500) return 1;  // Intermediate
        return 0;
    };
    const starCount = calculateStars(currentRole, currentXP);

    const StarBadge = starCount > 0 ? (
        <div className="flex gap-[1px] ml-1">
            {[...Array(starCount)].map((_, i) => (
                <Star key={i} size={8} className="text-yellow-500 fill-yellow-500" />
            ))}
        </div>
    ) : null;
    // 👆 PASTE THIS END 👆

    const canDelete = isMe || isManager;
    // Allow editing if type is 'text' OR if type is missing (legacy messages)
    const canEdit = isMe && !isDeleted && (msg.type === 'text' || !msg.type);
    const showEditHistory = isAdmin && msg.editHistory;

    const highlightText = (text, term) => {
        if (!text) return "";
        if (!term) return text;
        const parts = String(text).split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === term.toLowerCase()
                ? <span key={i} className="bg-yellow-300 text-gray-900 px-0.5 rounded-[2px] shadow-sm">{part}</span>
                : part
        );
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        if (msg.isUploading) return;
        if (msg.type === 'image' && !msg.fileName?.toLowerCase().endsWith('.pdf')) {
            const url = msg.mediaUrl.replace('/upload/', '/upload/fl_attachment/');
            window.open(url, '_blank');
            return;
        }
        try {
            const response = await fetch(msg.mediaUrl);
            if (!response.ok) throw new Error("Network error");
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = msg.fileName || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(msg.mediaUrl, '_blank');
        }
    };

    const handleView = (e) => {
        e.stopPropagation();
        if (msg.isUploading) return;
        window.open(msg.mediaUrl, '_blank');
    };

    const getDisplayName = () => {
        if (!isFirstLevelRater && !isManager) return msg.senderEmail.split('@')[0];
        if (isManager) return msg.senderEmail.split('@')[0];
        if (['admin', 'co_admin', 'assistant_admin', 'leader', 'group_leader'].includes(currentRole)) return msg.senderEmail.split('@')[0];
        return "Member";
    };
    const displayName = isMe ? "You" : getDisplayName();

    const getRoleTextColor = (role) => {
        const colors = { admin: 'text-gray-900', co_admin: 'text-amber-700', assistant_admin: 'text-yellow-600', leader: 'text-purple-700', group_leader: 'text-orange-600', rater: 'text-green-600' };
        return colors[role] || 'text-gray-500';
    };

    const getStatusIcon = () => {
        if (!isMe) return null;
        const readByIDs = msg.readBy ? Object.keys(msg.readBy).filter(id => id !== currentUser.uid) : [];
        const totalMemberIDs = groupMembers ? Object.keys(groupMembers).filter(id => id !== currentUser.uid) : [];
        if (totalMemberIDs.length > 0 && readByIDs.length >= totalMemberIDs.length) return <CheckCheck size={15} className="text-green-300" strokeWidth={2.5} />;
        if (readByIDs.length > 0) return <CheckCheck size={15} className="text-sky-200" strokeWidth={2.5} />;
        return <CheckCheck size={15} className="text-blue-200/60" />;
    };

    const reactions = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥'];

    const renderActionsMenu = () => (
        !isDeleted && !msg.isUploading && (
            <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-[60] bg-white/95 backdrop-blur shadow-md border border-gray-100 rounded-full px-2 py-1`}>
                <button onClick={() => onStar(msg)} className="p-1.5 hover:scale-110 transition"><Star size={14} fill={isStarred ? "gold" : "none"} className={isStarred ? "text-yellow-500" : "text-gray-400"} /></button>
                <button onClick={() => onForward(msg)} className="p-1.5 text-gray-400 hover:text-purple-500 transition"><Share size={14} /></button>
                {canDelete && <button onClick={() => onDelete(msg)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>}

                {/* EDIT BUTTON */}
                {canEdit && (
                    <button
                        onClick={() => onEdit(msg)}
                        className="p-1.5 text-gray-400 hover:text-green-500 transition"
                        title="Edit Message"
                    >
                        <Edit2 size={14} />
                    </button>
                )}

                {isManager && <button onClick={() => onPin(msg)} className="p-1.5 text-gray-400 hover:text-yellow-500 transition"><Pin size={14} /></button>}
                {msg.type !== 'poll' && <button onClick={() => onReply(msg)} className="p-1.5 text-gray-400 hover:text-blue-500 transition"><Reply size={14} /></button>}
                <div className="w-px h-3 bg-gray-300 mx-1"></div>
                <div className="relative">
                    <button onClick={() => setShowReactionMenu(!showReactionMenu)} className="p-1.5 text-gray-400 hover:text-orange-500 transition"><Smile size={14} /></button>
                    {showReactionMenu && (
                        <div className="absolute top-8 left-0 bg-white shadow-xl rounded-full p-1 flex gap-1 z-50">
                            {reactions.map(emoji => <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowReactionMenu(false); }} className="hover:bg-gray-100 p-1 rounded-full">{emoji}</button>)}
                        </div>
                    )}
                </div>
            </div>
        )
    );

    const renderReactions = () => (
        !isDeleted && msg.reactions && (
            <div className={`absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} flex gap-1 z-10`}>
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <div key={emoji} className="bg-white/90 border border-gray-100 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex gap-1">
                        <span>{emoji}</span><span className="font-bold text-gray-500">{Object.keys(users).length}</span>
                    </div>
                ))}
            </div>
        )
    );

    const renderDeletedBubble = (originalContent = null) => (
        <div className="flex flex-col">
            <p className="text-xs flex items-center gap-1 text-gray-500 italic">
                <Trash2 size={12} /> {msg.deletedByRole === 'admin' ? "Deleted by Admin" : "Message deleted"}
            </p>
            {isAdmin && originalContent && (
                <div className="mt-2 pt-2 border-t border-red-100 text-left">
                    <p className="text-[10px] font-bold text-red-500 mb-0.5 uppercase tracking-wide">Admin View:</p>
                    {originalContent}
                </div>
            )}
        </div>
    );
    const renderMessageContent = () => {
        // 1. POLLS
        if (msg.type === 'poll') {
            if (isDeleted) return renderDeletedBubble();
            return <PollMessage msg={msg} currentUser={currentUser} onVote={onVote} onReveal={onReveal} userProfiles={userProfiles} userRole={userData?.role} />;
        }

        // 2. VOICE MESSAGES (Recorded via Mic)
        if (msg.type === 'audio') {
            if (isDeleted) {
                if (isAdmin) {
                    return renderDeletedBubble(
                        <div className="opacity-70 scale-95 origin-left">
                            <VoiceMessage msg={msg} isMe={isMe} nameTextColor={getRoleTextColor(currentRole)} canSeeDeletedContent={true} />
                        </div>
                    );
                }
                return renderDeletedBubble();
            }
            return <VoiceMessage msg={msg} isMe={isMe} nameTextColor={getRoleTextColor(currentRole)} canSeeDeletedContent={false} />;
        }

        // 3. NEW FEATURE: UPLOADED AUDIO PLAYER (MP3, WAV, etc.)
        // We check this BEFORE the generic file block so it gets a Player instead of a Download card.
        if (msg.type === 'file' && isAudioFile(msg)) {
            if (isDeleted) return renderDeletedBubble();
            return (
                <div className={`p-3 rounded-2xl shadow-sm border ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
                    {/* Show Name if it's the first message in a group */}
                    {!isMe && showAvatar && (
                        <p className={`text-[11px] mb-1 font-bold ${getRoleTextColor(currentRole)}`}>
                            {displayName}
                        </p>
                    )}

                    {/* The Player */}
                    <audio
                        controls
                        src={msg.mediaUrl}
                        className="w-full max-w-xs"
                        preload="metadata"
                        controlsList="nodownload" // Optional: prevents download button inside player
                    />

                    {/* Footer with Metadata */}
                    <div className="flex justify-between items-center mt-1 text-[9px] opacity-70">
                        <span>{msg.fileName || "Audio File"}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            );
        }

        // 4. UNIFIED MEDIA BLOCK (Images, Videos, & Generic Files like PDFs)
        // This is your original code that handles styling, borders, and download buttons perfectly.
        if (['image', 'video', 'file'].includes(msg.type)) {
            if (isDeleted) return renderDeletedBubble(null);

            const containerBorder = isMe ? "border-blue-200" : "border-gray-100";
            const footerBg = isMe ? "bg-blue-600" : "bg-white";
            const footerTextMain = isMe ? "text-white" : "text-gray-800";
            const footerTextSub = isMe ? "text-blue-200" : "text-gray-500";
            const footerIconBg = isMe ? "bg-white/20 text-white" : "bg-blue-50 text-blue-500";

            return (
                <div className={`relative rounded-2xl overflow-hidden shadow-sm border ${containerBorder} bg-gray-50`}>
                    {!isMe && showAvatar && (
                        <div className="px-3 pt-2 pb-1 bg-white border-b border-gray-100">
                            <p className={`text-[11px] font-bold ${getRoleTextColor(currentRole)}`}>{displayName}</p>
                        </div>
                    )}
                    {(msg.type === 'image' || msg.type === 'video') && (
                        <div className="relative bg-gray-100 flex items-center justify-center min-h-[120px]">
                            {msg.isUploading ? (
                                <div className="flex flex-col items-center justify-center text-gray-400 gap-2 p-8">
                                    <Loader2 size={24} className="animate-spin text-blue-500" />
                                    <span className="text-xs font-medium">Uploading...</span>
                                </div>
                            ) : (
                                <>
                                    {msg.type === 'image' ? (
                                        <img src={msg.mediaUrl} alt="shared" className="w-full h-auto max-h-[200px] object-cover" />
                                    ) : (
                                        <video controls src={msg.mediaUrl} className="w-full h-auto max-h-[200px]" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button onClick={handleView} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition"><Eye size={20} /></button>
                                        <button onClick={handleDownload} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition"><Download size={20} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <div className={`p-3 flex items-center gap-3 ${footerBg}`}>
                        <div className={`p-2 rounded-lg shrink-0 ${footerIconBg}`}>
                            {msg.isUploading ? <Loader2 size={20} className="animate-spin" /> : (msg.type === 'image' ? <FileText size={20} /> : msg.type === 'video' ? <Play size={20} /> : <File size={20} />)}
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                            <p className={`text-xs font-bold truncate max-w-[200px] ${footerTextMain}`}>{highlightText(msg.fileName, searchTerm) || "File"}</p>
                            <p className={`text-[10px] ${footerTextSub}`}>{msg.fileSize || (msg.isUploading ? "Processing..." : "")}</p>
                        </div>
                        {!msg.isUploading && msg.type === 'file' && (
                            <button onClick={handleDownload} className={`p-2 rounded-full ${isMe ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`}><Download size={18} /></button>
                        )}
                        <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className={`text-[9px] ${footerTextSub} flex items-center gap-1`}>
                                {isStarred && <Star size={10} fill="currentColor" className="text-yellow-400" />}
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && !msg.isUploading && <div className="mt-0.5">{getStatusIcon()}</div>}
                        </div>
                    </div>
                </div>
            );
        }

        // 5. TEXT MESSAGES (and Deleted Text Logic)
        if (isDeleted) {
            if (isAdmin) {
                return renderDeletedBubble(<div className="text-sm text-red-600 font-medium">{msg.text || "[No Text Data]"}</div>);
            }
            return renderDeletedBubble();
        }

        return (
            <div className="flex flex-col">

                {/* --- ANIMATED STICKER LOGIC (ZOOM IN/OUT) --- */}
                {isSingleSticker(msg.text) ? (
                    <div className="p-2 bg-transparent relative group/sticker">
                        <style>
                            {`
                          /* Define the Zoom In/Out Animation */
                          @keyframes breatheAnimation {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.2); } /* Zoom In */
                            100% { transform: scale(1); }  /* Zoom Out */
                          }
                          
                          /* Optional: A Bounce Animation (Uncomment to use instead) */
                          @keyframes bounceAnimation {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                          }
                        `}
                        </style>

                        <span
                            className="text-5xl inline-block cursor-default origin-center drop-shadow-sm"
                            style={{
                                /* Change 'breatheAnimation' to 'bounceAnimation' if you prefer bouncing */
                                animation: 'breatheAnimation 2s infinite ease-in-out',
                                textShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            {msg.text}
                        </span>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed">{highlightText(msg.text, searchTerm)}</p>
                )}
                {/* ------------------------------------------- */}

                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'} opacity-90`}>
                    {msg.isEdited && <span className="text-[9px] mr-1 opacity-70">(edited)</span>}
                    {isStarred && <Star size={10} fill="currentColor" className="text-yellow-300 mr-1" />}
                    <span className="text-[9px] opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <div className="ml-1 translate-y-[1px]">{getStatusIcon()}</div>}
                </div>

                {showEditHistory && (
                    <div className={`mt-3 pt-2 border-t text-left ${isMe ? 'border-white/20' : 'border-black/10'}`}>
                        <p className={`text-[9px] font-bold mb-1 ${isMe ? 'text-white/80' : 'text-gray-500'}`}>Edit History (Admin):</p>
                        {Object.entries(msg.editHistory).map(([ts, t]) => <div key={ts} className={`text-[9px] line-through ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{t}</div>)}
                    </div>
                )}
            </div>
        );
    };

    // --- MESSAGE GROUPING ADJUSTMENTS ---
    // If part of sequence, reduce top margin to 1 (mb-1), else standard (mb-6)
    const marginClass = isSequence ? 'mb-1' : 'mb-6';

    return (
        <div id={msg.id} className={`flex gap-3 ${marginClass} group ${isMe ? 'flex-row-reverse' : ''} relative scroll-mt-32`}>
            {/* AVATAR: Only show if showAvatar is true */}
            <div className="shrink-0 w-[45px] relative overflow-visible">
                {showAvatar ? (
                    <>
                        {/* 1. Define Animation: Only injects if user has 3 Stars */}
                        {starCount === 3 && (
                            <style>
                                {`
                                  @keyframes starFlip {
                                    0% { transform: rotateY(0deg); filter: brightness(1) drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
                                    50% { transform: rotateY(180deg); filter: brightness(1.5) drop-shadow(0 0 4px rgba(255,255,255,1)); } /* Stronger glow at peak */
                                    100% { transform: rotateY(360deg); filter: brightness(1) drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
                                  }
                                `}
                            </style>
                        )}

                        {/* 2. The Avatar Image */}
                        <AnimeDP seed={msg.senderEmail || msg.senderId} role={currentRole} size={45} xp={currentXP} />

                        {/* 3. The Stars */}
                        {starCount > 0 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                                {[...Array(starCount)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={10} 
                                        // ✅ ADDED: drop-shadow-[0_0_2px_rgba(255,255,255,0.9)] for the white glow
                                       className="text-[#ECAB31] fill-[#ECAB31] drop-shadow-[0_0_2px_rgba(255,255,255,1.0)]"
                                        style={starCount === 3 ? {
                                            // Apply animation ONLY if they have 3 stars
                                            animation: 'starFlip 3s infinite linear',
                                            // Stagger the animation so they wave (0s, 0.2s, 0.4s)
                                            animationDelay: `${i * 0.2}s` 
                                        } : {}} 
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // Placeholder to keep alignment
                    <div className="w-[45px]" />
                )}
            </div>

            <div className="max-w-[80%] md:max-w-[60%] relative">
                <div className="relative">
                    {msg.replyTo && !isDeleted && (
                        <div onClick={() => onReplyClick && onReplyClick(msg.replyTo.id)} className={`text-xs mb-1 p-2 rounded-lg border-l-4 bg-white/50 border-gray-400 text-gray-500 opacity-80 cursor-pointer hover:bg-white/80 transition ${isMe ? 'text-right' : 'text-left'}`}>
                            <span className="font-bold block mb-0.5">{isFirstLevelRater && !isManager && !isMe ? "Member/Admin" : msg.replyTo.sender}</span>
                            <span className="italic truncate block">{msg.replyTo.text}</span>
                        </div>
                    )}

                    {/* Content Wrapper */}
                    {(['image', 'video', 'file'].includes(msg.type) && !isDeleted) ? (
                        renderMessageContent()
                    ) : (
                        <div className={`relative p-4 shadow-sm break-words ${isDeleted ? 'bg-gray-100 border border-gray-200 text-gray-400 rounded-2xl italic' : isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'}`}>
                            {/* Only show Name Header if NOT Me, NOT Deleted, AND it is the First in sequence */}
                            {!isMe && !isDeleted && showAvatar && (
                                <p className={`text-[11px] mb-1 font-bold ${getRoleTextColor(currentRole)}`}>{displayName}</p>
                            )}
                            {renderMessageContent()}
                        </div>
                    )}

                    {renderActionsMenu()}
                    {!isDeleted && renderReactions()}
                </div>
            </div>
        </div>
    );
}