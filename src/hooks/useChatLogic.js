import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, push, onValue, set, update, remove, get } from 'firebase/database';
import { addXP, getReactionXp, checkInactivityPenalty } from '../utils/xpSystem';

// --- CLOUDINARY CONFIGURATION ---
const CLOUD_NAME = "dkfy7dsal"; 
const UPLOAD_PRESET = "chat_media";

export default function useChatLogic(activeGroup, currentUser, userData) {
  const [messages, setMessages] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  
  // UI State
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [msgToDelete, setMsgToDelete] = useState(null);
  const [msgToForward, setMsgToForward] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // <--- NEW: Upload State

  const isManager = ['admin', 'assistant_admin', 'co_admin', 'leader', 'group_leader'].includes(userData?.role);

  // --- 1. FETCH LIVE DATA ---
  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) setUserProfiles(snapshot.val());
    });
    return () => unsubUsers();
  }, []);

  // --- 2. INIT & MESSAGES ---
  useEffect(() => {
    if (currentUser) {
      checkInactivityPenalty(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!activeGroup?.id) return;
    
    // Listen for Messages
    const messagesRef = ref(database, `groups/${activeGroup.id}/messages`);
    const unsubMsg = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      setMessages(data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : []);
    });

    // Listen for Group Settings (Pin/Restrict)
    const groupRef = ref(database, `groups/${activeGroup.id}`);
    const unsubGroup = onValue(groupRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPinnedMessage(data.pinnedMessage || null);
        setIsRestricted(data.restricted || false);
      }
    });

    return () => { unsubMsg(); unsubGroup(); };
  }, [activeGroup]);

  // --- 3. READ RECEIPTS ---
  useEffect(() => {
    if (!activeGroup?.id || !currentUser || messages.length === 0) return;

    const updates = {};
    messages.forEach(msg => {
      if (msg.senderId !== currentUser.uid && (!msg.readBy || !msg.readBy[currentUser.uid])) {
         updates[`groups/${activeGroup.id}/messages/${msg.id}/readBy/${currentUser.uid}`] = Date.now();
      }
    });

    if (Object.keys(updates).length > 0) {
      update(ref(database), updates);
    }
  }, [messages, activeGroup, currentUser]);

  // --- 4. HANDLERS ---

  // --- NEW: FILE UPLOAD (Image/Video) ---
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET); 
        formData.append("cloud_name", CLOUD_NAME);

        // Upload to Cloudinary
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.secure_url) {
            // Determine type
            const type = data.resource_type === 'video' ? 'video' : 'image';
            
            // Send Message to Firebase
            const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
            const newMsg = {
                type: type, // 'image' or 'video'
                mediaUrl: data.secure_url,
                caption: "", 
                senderId: currentUser.uid,
                senderEmail: currentUser.email,
                senderRole: userData?.role || 'user',
                senderXp: userData?.xp || 0,
                createdAt: Date.now()
            };
            
            await set(push(chatRef), newMsg);
            addXP(currentUser.uid, 5); // +5 XP for sharing media
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("File upload failed. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleSendAudio = (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
      const newMsg = {
        type: 'audio',
        audioUrl: base64Audio,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        senderRole: userData?.role || 'user',
        senderXp: userData?.xp || 0,
        createdAt: Date.now()
      };
      await set(push(chatRef), newMsg);
      addXP(currentUser.uid, 3);
    };
  };

  const handleCreatePoll = async (pollData) => {
    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    const newMsg = {
      type: 'poll',
      ...pollData,
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      senderRole: userData?.role || 'user',
      senderXp: userData?.xp || 0,
      createdAt: Date.now()
    };
    await set(push(chatRef), newMsg);
    addXP(currentUser.uid, 2);
  };

  const handleVote = async (msgId, optionId) => {
    const msgRef = ref(database, `groups/${activeGroup.id}/messages/${msgId}`);
    const snapshot = await get(msgRef);
    const msg = snapshot.val();
    const userId = currentUser.uid;
    const previousOptionId = msg.votes ? msg.votes[userId] : null;
    const hasVoted = previousOptionId !== undefined && previousOptionId !== null;

    if (msg.allowVoteChange === false && hasVoted) {
      alert("This poll does not allow changing your vote.");
      return;
    }

    // XP LOGIC
    if (!hasVoted) {
      if (msg.isQuiz) {
        if (msg.correctOptionId === optionId) addXP(userId, 10);
        else addXP(userId, -1);
      } else {
        addXP(userId, 2);
      }
    }

    const updates = {};
    if (previousOptionId === optionId) {
        if (msg.allowVoteChange === false) return;
        const prevOptIndex = msg.options.findIndex(o => o.id === previousOptionId);
        if (prevOptIndex !== -1) updates[`groups/${activeGroup.id}/messages/${msgId}/options/${prevOptIndex}/voteCount`] = Math.max(0, (msg.options[prevOptIndex].voteCount || 0) - 1);
        updates[`groups/${activeGroup.id}/messages/${msgId}/votes/${userId}`] = null;
    } else {
        if (hasVoted) {
            const prevOptIndex = msg.options.findIndex(o => o.id === previousOptionId);
            if (prevOptIndex !== -1) updates[`groups/${activeGroup.id}/messages/${msgId}/options/${prevOptIndex}/voteCount`] = Math.max(0, (msg.options[prevOptIndex].voteCount || 0) - 1);
        }
        const newOptIndex = msg.options.findIndex(o => o.id === optionId);
        if (newOptIndex !== -1) updates[`groups/${activeGroup.id}/messages/${msgId}/options/${newOptIndex}/voteCount`] = (msg.options[newOptIndex].voteCount || 0) + 1;
        updates[`groups/${activeGroup.id}/messages/${msgId}/votes/${userId}`] = optionId;
    }
    await update(ref(database), updates);
  };

  const handleReveal = async (msgId) => {
    await update(ref(database, `groups/${activeGroup.id}/messages/${msgId}`), { isRevealed: true });
  };

  const handleSendMessage = async (text) => {
    if (editingMessage) {
      const updates = {};
      updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/text`] = text;
      updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/isEdited`] = true;
      updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/editHistory/${Date.now()}`] = editingMessage.text;
      await update(ref(database), updates);
      setEditingMessage(null);
      return;
    }
    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    const newMsg = {
      text,
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      senderRole: userData?.role || 'user',
      senderXp: userData?.xp || 0,
      createdAt: Date.now()
    };
    if (replyTo) {
      newMsg.replyTo = {
        id: replyTo.id,
        text: replyTo.text,
        sender: replyTo.senderEmail.split('@')[0]
      };
    }
    await set(push(chatRef), newMsg);
    setReplyTo(null);
    addXP(currentUser.uid, 1);
  };

  const handleForwardAction = async (targetGroupIds) => {
    if (!msgToForward) return;
    for (const groupId of targetGroupIds) {
        const chatRef = ref(database, `groups/${groupId}/messages`);
        const newMsg = {
            senderId: currentUser.uid,
            senderEmail: currentUser.email,
            senderRole: userData?.role || 'user',
            senderXp: userData?.xp || 0,
            createdAt: Date.now(),
            isForwarded: true,
        };
        if (msgToForward.type === 'poll') {
            newMsg.type = 'poll';
            newMsg.question = msgToForward.question;
            newMsg.isQuiz = msgToForward.isQuiz || false;
            if(msgToForward.isQuiz) newMsg.correctOptionId = msgToForward.correctOptionId;
            newMsg.options = msgToForward.options.map(opt => ({ id: opt.id, text: opt.text, voteCount: 0 }));
        } else if (msgToForward.type === 'audio') {
            newMsg.type = 'audio';
            newMsg.audioUrl = msgToForward.audioUrl;
        } else if (msgToForward.type === 'image' || msgToForward.type === 'video') {
            newMsg.type = msgToForward.type;
            newMsg.mediaUrl = msgToForward.mediaUrl;
        } else {
            newMsg.text = msgToForward.text;
        }
        await set(push(chatRef), newMsg);
    }
    setMsgToForward(null);
  };

  const handleReaction = async (msgId, emoji) => {
    const msgRef = ref(database, `groups/${activeGroup.id}/messages/${msgId}`);
    const snapshot = await get(msgRef);
    if (!snapshot.exists()) return;
    const msg = snapshot.val();
    const authorId = msg.senderId;

    const reactionsRef = ref(database, `groups/${activeGroup.id}/messages/${msgId}/reactions`);
    const rSnapshot = await get(reactionsRef);
    const data = rSnapshot.val() || {};
    let existingEmoji = null;
    Object.keys(data).forEach(key => { if (data[key][currentUser.uid]) existingEmoji = key; });

    const updates = {};
    const reactorRole = userData?.role || 'user';
    let xpValue = (emoji === '👎') ? -5 : getReactionXp(reactorRole);

    if (existingEmoji === emoji) {
      updates[`groups/${activeGroup.id}/messages/${msgId}/reactions/${emoji}/${currentUser.uid}`] = null;
      if (authorId !== currentUser.uid) addXP(authorId, -xpValue);
    } else {
      if (existingEmoji) updates[`groups/${activeGroup.id}/messages/${msgId}/reactions/${existingEmoji}/${currentUser.uid}`] = null;
      else if (authorId !== currentUser.uid) addXP(authorId, xpValue);
      updates[`groups/${activeGroup.id}/messages/${msgId}/reactions/${emoji}/${currentUser.uid}`] = true;
    }
    await update(ref(database), updates);
  };

  const handleDeleteClick = (msg) => {
    const myRole = userData?.role;
    const senderRole = msg.senderRole;
    const isMe = msg.senderId === currentUser.uid;
    if (senderRole === 'admin' && myRole !== 'admin') return alert("Cannot delete Main Admin message.");
    
    let canDelete = false;
    if (isMe) canDelete = true;
    else if (myRole === 'admin') canDelete = true;
    else if ((myRole === 'co_admin' || myRole === 'assistant_admin') && senderRole !== 'admin') canDelete = true;
    else if ((myRole === 'leader' || myRole === 'group_leader') && senderRole === 'rater') canDelete = true;

    if (!canDelete) return alert("Permission denied.");
    setMsgToDelete(msg);
  };

  const confirmDeleteAction = async () => {
    if (!msgToDelete) return;
    await update(ref(database, `groups/${activeGroup.id}/messages/${msgToDelete.id}`), {
      isDeleted: true,
      deletedBy: currentUser.email.split('@')[0],
      deletedByRole: userData?.role
    });
    if (msgToDelete.senderId !== currentUser.uid) addXP(msgToDelete.senderId, -20);
    setMsgToDelete(null);
  };

  // --- RETURN OBJECT ---
  return {
    messages, pinnedMessage, isRestricted, isManager,
    userProfiles, // Live User Data
    replyTo, setReplyTo,
    editingMessage, setEditingMessage,
    msgToDelete, setMsgToDelete,
    msgToForward, setMsgToForward,
    showPollModal, setShowPollModal,
    isUploading, // <--- Export Loading State
    
    // Actions
    handleSendMessage, handleSendAudio, handleCreatePoll, handleVote, handleReveal,
    handleReaction, handleDeleteClick, confirmDeleteAction, handleForwardAction,
    handleFileUpload, // <--- Export File Upload Handler
    
    // Pinning Logic
    handlePin: async (msg) => isManager && update(ref(database, `groups/${activeGroup.id}`), { pinnedMessage: { text: msg.text, sender: msg.senderEmail, id: msg.id } }),
    handleUnpin: async () => isManager && remove(ref(database, `groups/${activeGroup.id}/pinnedMessage`)),
    toggleRestriction: async () => isManager && update(ref(database, `groups/${activeGroup.id}`), { restricted: !isRestricted })
  };
}