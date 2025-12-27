import React, { useEffect, useRef, useState } from 'react';
import { X, Video } from 'lucide-react';

export default function MeetingModal({ isOpen, onClose, groupId, groupName, currentUser }) {
  const jitsiContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !groupId) return;

    const loadJitsiScript = () => {
      // We still use the main Jitsi script, it works for other domains too
      if (window.JitsiMeetExternalAPI) {
        startConference();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = startConference;
      document.body.appendChild(script);
    };

    const startConference = () => {
      setLoading(false);
      try {
        // --- CHANGE THIS LINE ---
        // 'meet.jit.si' requires login now. We use a free community server instead.
        const domain = 'jitsi.riot.im'; 
        // ------------------------

        // Clean room name to avoid errors
        const cleanGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '');
        const uniqueRoomName = `VivekApp_${cleanGroupName}_${groupId}`; 

        const options = {
          roomName: uniqueRoomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: currentUser.displayName || currentUser.email.split('@')[0]
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false, // Jump straight in
            disableDeepLinking: true, 
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'hangup', 'profile', 'chat', 'raisehand', 
              'videoquality', 'tileview', 'select-background'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        api.addEventListener('videoConferenceLeft', () => {
          onClose();
          api.dispose();
        });
        
        api.addEventListener('readyToClose', () => {
            onClose();
            api.dispose();
        });

      } catch (error) {
        console.error("Jitsi Error:", error);
      }
    };

    loadJitsiScript();

    return () => {
      if (jitsiContainerRef.current) jitsiContainerRef.current.innerHTML = "";
    };
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg text-white">
                    <Video size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-lg">Meeting: {groupName}</h2>
                    <p className="text-xs text-gray-400">Powered by Open Jitsi Server</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/20 rounded-full transition"
            >
                <X size={24} />
            </button>
        </div>

        {/* Jitsi Container */}
        <div className="flex-1 bg-black relative group">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                    Connecting to Server...
                </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}