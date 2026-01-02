import { useState } from 'react';
import { database } from '../firebase';
import { ref, push, set, update, remove } from 'firebase/database';
import { addXP } from '../utils/xpSystem';

const CLOUD_NAME = "dkfy7dsal"; 
const UPLOAD_PRESET = "chat_media"; 

export default function useMessageActions(activeGroup, currentUser, userData) {

  const getMessageSnippet = (msg) => {
    if (msg.text) return msg.text;
    if (msg.type === 'image') return "📷 Image";
    if (msg.type === 'video') return "🎥 Video";
    if (msg.type === 'audio') return "🎵 Audio";
    if (msg.type === 'file') return `📁 ${msg.fileName || "File"}`;
    if (msg.type === 'poll') return "📊 Poll";
    return "Message";
  };

  const handleSendMessage = async (text, replyTo, editingMessage) => {
    if (editingMessage) {
        const updates = {};
        updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/text`] = text;
        updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/isEdited`] = true;
        updates[`groups/${activeGroup.id}/messages/${editingMessage.id}/editHistory/${Date.now()}`] = editingMessage.text;
        await update(ref(database), updates);
        return true;
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
        text: getMessageSnippet(replyTo),
        sender: replyTo.senderEmail.split('@')[0]
      };
    }
    await set(push(chatRef), newMsg);
    addXP(currentUser.uid, 1);
    return false;
  };

  const handleFileUpload = async (file, category = 'file') => {
    if (!file) return;

    let smartType = category;
    if (smartType === 'file') {
        if (file.type && file.type.startsWith('image/')) smartType = 'image';
        if (file.type && file.type.startsWith('video/')) smartType = 'video';
    }

    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    const newMsgRef = push(chatRef);
    
    await set(newMsgRef, {
        type: smartType, 
        isUploading: true, 
        fileName: file.name,
        fileSize: "Uploading...",
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        senderRole: userData?.role || 'user',
        senderXp: userData?.xp || 0,
        createdAt: Date.now()
    });

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET); 
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: "POST", 
            body: formData
        });
        
        const data = await res.json();

        if (res.ok && data.secure_url) {
            let finalType = smartType; 
            if (finalType === 'image' && file.name.toLowerCase().endsWith('.pdf')) finalType = 'file';

            const fileSize = (file.size / (1024 * 1024));
            const sizeStr = fileSize < 1 ? (file.size / 1024).toFixed(0) + " KB" : fileSize.toFixed(2) + " MB";

            await update(newMsgRef, {
                mediaUrl: data.secure_url,
                resourceType: data.resource_type || 'auto', 
                type: finalType, 
                fileSize: sizeStr,
                isUploading: null 
            });
            addXP(currentUser.uid, 5); 
        } else {
             console.error("Cloudinary Error:", data);
             alert(`Upload Error: ${data.error?.message || "Unknown error"}`);
             remove(newMsgRef); 
        }
    } catch (error) {
        console.error("Network Error:", error);
        alert("Network Error: Could not upload file.");
        remove(newMsgRef);
    }
  };

  const handleSendAudio = (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
      await set(push(chatRef), {
        type: 'audio', audioUrl: reader.result,
        senderId: currentUser.uid, senderEmail: currentUser.email,
        senderRole: userData?.role || 'user', senderXp: userData?.xp || 0, createdAt: Date.now()
      });
      addXP(currentUser.uid, 3);
    };
  };

  // ✅ CREATE POLL (Added 'text' field so it shows up)
  const handleCreatePoll = async (pollData) => {
    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    await set(push(chatRef), {
      type: 'poll',
      text: pollData.question, // 👈 CRITICAL: Needed for search filter
      poll: pollData, 
      senderId: currentUser.uid, 
      senderEmail: currentUser.email,
      senderRole: userData?.role || 'user', 
      senderXp: userData?.xp || 0, 
      createdAt: Date.now()
    });
    addXP(currentUser.uid, 2);
  };

  // ✅ FORWARD ACTION (Added 'text' field so it shows up)
  const handleForwardAction = async (arg1, arg2) => {
    let msgToForward = arg1;
    let targetGroupIds = arg2;

    if (Array.isArray(arg1) && !Array.isArray(arg2)) {
        msgToForward = arg2;
        targetGroupIds = arg1;
    }

    if (!msgToForward || !targetGroupIds || !Array.isArray(targetGroupIds)) {
        console.error("⛔ Forward Blocked: Invalid Data", { msg: msgToForward, targets: targetGroupIds });
        return;
    }

    for (const item of targetGroupIds) {
       const targetId = typeof item === 'object' ? item.id : item;
       const chatRef = ref(database, `groups/${targetId}/messages`);
       
       const newMsg = {
           senderId: currentUser.uid, 
           senderEmail: currentUser.email,
           senderRole: userData?.role || 'user', 
           senderXp: userData?.xp || 0,
           createdAt: Date.now(), 
           isForwarded: true,
           type: msgToForward.type || 'text'
       };
       
       if (msgToForward.type === 'poll') {
            const sourcePoll = msgToForward.poll || msgToForward;
            let safeOptions = [];
            const rawOptions = sourcePoll.options;

            if (Array.isArray(rawOptions)) {
                safeOptions = rawOptions;
            } else if (rawOptions && typeof rawOptions === 'object') {
                safeOptions = Object.values(rawOptions);
            }

            // 👈 CRITICAL: Add 'text' so ChatWindow doesn't filter it out!
            newMsg.text = sourcePoll.question || "Forwarded Poll"; 

            newMsg.poll = {
                question: sourcePoll.question || "Forwarded Poll",
                isQuiz: sourcePoll.isQuiz || false,
                correctOptionId: sourcePoll.correctOptionId || null,
                allowVoteChange: sourcePoll.allowVoteChange || false,
                votes: {}, 
                isRevealed: false,
                options: safeOptions.map((opt, index) => ({ 
                    id: opt.id || index, 
                    text: opt.text || "Option", 
                    voteCount: 0 
                }))
            };
        } else {
            newMsg.text = msgToForward.text || "";
            newMsg.mediaUrl = msgToForward.mediaUrl || null;
            newMsg.fileName = msgToForward.fileName || null;
            newMsg.fileSize = msgToForward.fileSize || null;
            newMsg.audioUrl = msgToForward.audioUrl || null;
        }

       await set(push(chatRef), newMsg);
    }
  };

  return { handleSendMessage, handleFileUpload, handleSendAudio, handleCreatePoll, handleForwardAction, getMessageSnippet };
}