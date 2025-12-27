import { useState, useEffect, useRef } from 'react';
// 1. IMPORT DATABASE ONLY (Removed Storage imports)
import { database } from '../firebase';
import { ref, push, set, update, remove, get, onValue, runTransaction, serverTimestamp, onDisconnect } from 'firebase/database';
import useChatData from './useChatData'; 
import useMessageActions from './useMessageActions';
import useInteractionLogic from './useInteractionLogic';

export default function useChatLogic(activeGroup, currentUser, userData) {
  // --- DATA & STATE ---
  const { messages, userProfiles, pinnedMessage, isRestricted } = useChatData(activeGroup, currentUser);
  const [starredMessages, setStarredMessages] = useState({});
  
  // 1. NEW: Typing Users State
  const [typingUsers, setTypingUsers] = useState([]);

  const [lastViewed, setLastViewed] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const initialLoadRef = useRef(true);

  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [msgToDelete, setMsgToDelete] = useState(null);
  const [msgToForward, setMsgToForward] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);

  // --- EXISTING HOOKS ---
  const { 
    handleSendMessage, handleFileUpload, 
    handleForwardAction, getMessageSnippet 
  } = useMessageActions(activeGroup, currentUser, userData);

  const { 
    handleReaction, confirmDeleteAction, 
    handlePinAction, handleUnpinAction, isManager 
  } = useInteractionLogic(activeGroup, currentUser, userData, getMessageSnippet);

  // =================================================================================
  //  🔥 1. POLL LOGIC (Create, Vote, Reveal)
  // =================================================================================

  const handleCreatePoll = async (pollData) => {
    if (!activeGroup) return;
    try {
      const messagesRef = ref(database, `groups/${activeGroup.id}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        type: 'poll', 
        text: pollData.question,
        createdAt: serverTimestamp(),
        poll: {
          question: pollData.question,
          options: pollData.options,
          isQuiz: pollData.isQuiz,
          correctOptionId: pollData.correctOptionId,
          allowVoteChange: pollData.allowVoteChange,
          votes: {}
        }
      });
      setShowPollModal(false);
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  };

  const handleVote = (messageId, optionId) => {
    if (!activeGroup) return;
    const pollRef = ref(database, `groups/${activeGroup.id}/messages/${messageId}/poll`);

    runTransaction(pollRef, (currentPoll) => {
      if (currentPoll) {
        if (!currentPoll.votes) currentPoll.votes = {};
        if (!currentPoll.options) return; 

        const userId = currentUser.uid;
        const previousVoteId = currentPoll.votes[userId];

        // 1. New Vote
        if (previousVoteId === undefined || previousVoteId === null) {
          currentPoll.votes[userId] = optionId;
          if (currentPoll.options[optionId]) {
             currentPoll.options[optionId].voteCount = (currentPoll.options[optionId].voteCount || 0) + 1;
          }
        }
        // 2. Change Vote
        else if (currentPoll.allowVoteChange && previousVoteId !== optionId) {
          if (currentPoll.options[previousVoteId]) {
             currentPoll.options[previousVoteId].voteCount = Math.max(0, (currentPoll.options[previousVoteId].voteCount || 0) - 1);
          }
          if (currentPoll.options[optionId]) {
             currentPoll.options[optionId].voteCount = (currentPoll.options[optionId].voteCount || 0) + 1;
          }
          currentPoll.votes[userId] = optionId;
        }
      }
      return currentPoll;
    }).catch(console.error);
  };

  const handleReveal = async (messageId) => {
    if (!activeGroup) return;
    try {
      const pollRef = ref(database, `groups/${activeGroup.id}/messages/${messageId}/poll`);
      await update(pollRef, { isRevealed: true });
    } catch (error) {
      console.error("Error revealing answer:", error);
    }
  };

  // =================================================================================
  //  🎤 2. AUDIO LOGIC (DATABASE ONLY - NO STORAGE REQUIRED)
  // =================================================================================
  
  const handleSendAudio = async (audioBlob) => {
    if (!activeGroup || !currentUser) return;

    // Helper: Convert Blob to Base64 String
    const blobToBase64 = (blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    try {
      // 1. Convert Audio to String (Base64)
      const base64Audio = await blobToBase64(audioBlob);

      // 2. Save Message to Database (Storing audio data directly in the message)
      const messagesRef = ref(database, `groups/${activeGroup.id}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        type: 'audio',
        mediaUrl: base64Audio, // This string works directly in <audio src="...">
        text: 'Voice Message',
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error sending voice message:", error);
      alert("Failed to send voice message.");
    }
  };

  // =================================================================================
  //  ⌨️ 3. TYPING INDICATOR LOGIC (NEW)
  // =================================================================================

  // Listener: Who is typing?
  useEffect(() => {
    if (!activeGroup?.id || !currentUser) return;
    
    const typingRef = ref(database, `groups/${activeGroup.id}/typing`);

    const unsub = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Get names of everyone typing EXCEPT me
      const names = Object.entries(data)
        .filter(([uid, _]) => uid !== currentUser.uid)
        .map(([_, name]) => name);
      setTypingUsers(names);
    });

    return () => unsub();
  }, [activeGroup, currentUser]);

  // Handler: Update my status
  const handleTypingStatus = async (isTyping) => {
    if (!activeGroup?.id || !currentUser) return;
    
    const myTypingRef = ref(database, `groups/${activeGroup.id}/typing/${currentUser.uid}`);
    
    if (isTyping) {
        const name = userProfiles[currentUser.uid]?.displayName || currentUser.email?.split('@')[0] || "Member";
        await set(myTypingRef, name);
        // Ensure status is removed if internet disconnects
        onDisconnect(myTypingRef).remove();
    } else {
        await remove(myTypingRef);
    }
  };

  // =================================================================================

  // --- FETCH STARRED MESSAGES ---
  useEffect(() => {
    if (!currentUser || !activeGroup?.id) return;
    const starRef = ref(database, `users/${currentUser.uid}/starredMessages/${activeGroup.id}`);
    const unsub = onValue(starRef, (snapshot) => setStarredMessages(snapshot.val() || {}));
    return () => unsub();
  }, [currentUser, activeGroup]);

  // --- FETCH LAST VIEWED ---
  useEffect(() => {
    if (!currentUser || !activeGroup?.id) return;
    const lastViewedRef = ref(database, `users/${currentUser.uid}/lastViewed/${activeGroup.id}`);
    get(lastViewedRef).then((snapshot) => {
        const time = snapshot.val() || 0;
        if (initialLoadRef.current) {
            setLastViewed(time);
            initialLoadRef.current = false;
        }
        update(ref(database, `users/${currentUser.uid}/lastViewed`), { [activeGroup.id]: Date.now() });
    });
    return () => { initialLoadRef.current = true; };
  }, [activeGroup, currentUser]);

  // --- COUNT UNREAD ---
  useEffect(() => {
    if (!messages.length) return;
    const count = messages.filter(m => m.createdAt > lastViewed && m.senderId !== currentUser.uid).length;
    setUnreadCount(count);
  }, [messages, lastViewed, currentUser]);

  // --- HANDLERS ---
  const handleStarMessage = async (msg) => {
    const starRef = ref(database, `users/${currentUser.uid}/starredMessages/${activeGroup.id}/${msg.id}`);
    const isStarred = starredMessages[msg.id];
    if (isStarred) await remove(starRef);
    else await set(starRef, { id: msg.id, text: getMessageSnippet(msg), timestamp: Date.now() });
  };

  const onSendMessage = async (text) => {
    // Stop typing when message is sent
    handleTypingStatus(false);
    
    const wasEdit = await handleSendMessage(text, replyTo, editingMessage);
    if (wasEdit) setEditingMessage(null);
    else setReplyTo(null);
  };

  const onForward = async (targetGroupIds) => {
    await handleForwardAction(msgToForward, targetGroupIds);
    setMsgToForward(null);
  };

  const onDeleteConfirm = async () => {
    await confirmDeleteAction(msgToDelete);
    setMsgToDelete(null);
  };

  const handleDeleteClick = (msg) => {
    const myRole = userData?.role;
    const senderRole = msg.senderRole;
    const isMe = msg.senderId === currentUser.uid;
    if (senderRole === 'admin' && myRole !== 'admin') return alert("Cannot delete Main Admin message.");
    
    let canDelete = isMe || ['admin', 'co_admin', 'assistant_admin'].includes(myRole) || (['leader', 'group_leader'].includes(myRole) && senderRole === 'rater');
    if (!canDelete) return alert("Permission denied.");
    setMsgToDelete(msg);
  };

  return {
    messages, pinnedMessage, isRestricted, isManager, userProfiles, starredMessages,
    replyTo, setReplyTo, editingMessage, setEditingMessage,
    msgToDelete, setMsgToDelete, msgToForward, setMsgToForward,
    showPollModal, setShowPollModal,
    
    // NEW: Return typing data and handler
    typingUsers, 
    handleTypingStatus,

    lastViewed, 
    unreadCount, 
    markAsRead: () => setUnreadCount(0),

    handleSendMessage: onSendMessage,
    handleForwardAction: onForward,
    confirmDeleteAction: onDeleteConfirm,
    handleDeleteClick,
    handleStarMessage,
    handleFileUpload, 
    
    handleSendAudio, // Now uses the Base64 logic
    
    handleCreatePoll, 
    handleVote,       
    handleReveal, 
    handleReaction, 
    handlePin: handlePinAction,
    handleUnpin: handleUnpinAction,
    toggleRestriction: async () => isManager && update(ref(database, `groups/${activeGroup.id}`), { restricted: !isRestricted })
  };
}