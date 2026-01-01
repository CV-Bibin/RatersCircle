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

  // --- FIXED & SMART UPLOAD LOGIC ---
  const handleFileUpload = async (file, category = 'file') => {
    if (!file) return;

    // ✅ SMART AUTO-DETECTION
    // Even if 'category' says "file", we check if it is actually an image/video.
    let smartType = category;
    if (smartType === 'file') {
        if (file.type && file.type.startsWith('image/')) smartType = 'image';
        if (file.type && file.type.startsWith('video/')) smartType = 'video';
    }

    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    const newMsgRef = push(chatRef);
    
    // Use smartType for the initial "Uploading..." bubble
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
            
            // Safety Check: If a PDF was somehow marked as image, force it back to file
            if (finalType === 'image' && file.name.toLowerCase().endsWith('.pdf')) finalType = 'file';

            const fileSize = (file.size / (1024 * 1024));
            const sizeStr = fileSize < 1 ? (file.size / 1024).toFixed(0) + " KB" : fileSize.toFixed(2) + " MB";

            await update(newMsgRef, {
                mediaUrl: data.secure_url,
                resourceType: data.resource_type || 'auto', 
                type: finalType, // ✅ Shows as Photo if it is one!
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

  // ... (keep handleSendAudio, handleCreatePoll, handleForwardAction as is) ...
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

  const handleCreatePoll = async (pollData) => {
    const chatRef = ref(database, `groups/${activeGroup.id}/messages`);
    await set(push(chatRef), {
      type: 'poll', ...pollData,
      senderId: currentUser.uid, senderEmail: currentUser.email,
      senderRole: userData?.role || 'user', senderXp: userData?.xp || 0, createdAt: Date.now()
    });
    addXP(currentUser.uid, 2);
  };

  const handleForwardAction = async (msgToForward, targetGroupIds) => {
    if (!msgToForward) return;
    for (const groupId of targetGroupIds) {
        const chatRef = ref(database, `groups/${groupId}/messages`);
        const newMsg = {
            senderId: currentUser.uid, senderEmail: currentUser.email,
            senderRole: userData?.role || 'user', senderXp: userData?.xp || 0,
            createdAt: Date.now(), isForwarded: true,
            type: msgToForward.type || 'text',
            text: msgToForward.text || "",
            mediaUrl: msgToForward.mediaUrl || null,
            fileName: msgToForward.fileName || null,
            fileSize: msgToForward.fileSize || null,
            audioUrl: msgToForward.audioUrl || null
        };
        if (msgToForward.type === 'poll') {
            newMsg.question = msgToForward.question;
            newMsg.options = msgToForward.options.map(opt => ({ id: opt.id, text: opt.text, voteCount: 0 }));
        }
        await set(push(chatRef), newMsg);
    }
  };

  return { handleSendMessage, handleFileUpload, handleSendAudio, handleCreatePoll, handleForwardAction, getMessageSnippet };
}