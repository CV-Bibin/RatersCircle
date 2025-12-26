import React, { useRef } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function MediaUpload({ onUpload, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = null;
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />
      
      <button 
        type="button" 
        onClick={handleClick} 
        disabled={isUploading}
        className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition relative group"
        title="Upload Image/Video"
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin text-blue-500" />
        ) : (
          <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
        )}
      </button>
    </>
  );
}