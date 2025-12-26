import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Search } from 'lucide-react';
import { database } from '../../firebase';
import { ref, onValue } from 'firebase/database';

export default function ForwardModal({ isOpen, onClose, onForward }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    
    const groupsRef = ref(database, 'groups');
    onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          // SAFETY FILTER: Remove groups with no name
          .filter(g => g.name && typeof g.name === 'string'); 
        setGroups(list);
      }
    });
  }, [isOpen]);

  const toggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleSend = () => {
    if (selectedGroups.length > 0) {
        onForward(selectedGroups);
        setSelectedGroups([]);
        onClose();
    }
  };

  if (!isOpen) return null;

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl w-[320px] rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Forward to...</h3>
            <p className="text-[10px] text-gray-400 font-medium">{selectedGroups.length} selected</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-1">
            <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full bg-gray-50 text-xs py-2 pl-8 pr-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-100 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="p-2 overflow-y-auto max-h-[300px] scrollbar-hide">
          {filteredGroups.length === 0 ? (
             <div className="text-center py-6 text-gray-300 text-xs italic">No groups found</div>
          ) : (
             filteredGroups.map(group => {
                const isSelected = selectedGroups.includes(group.id);
                // SAFETY CHECK: Ensure name exists before accessing index 0
                const firstLetter = (group.name && group.name[0]) ? group.name[0].toUpperCase() : "?";

                return (
                    <div 
                      key={group.id} 
                      onClick={() => toggleGroup(group.id)}
                      className={`p-2 mb-1.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 group
                        ${isSelected ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md scale-[1.02] translate-x-1' : 'hover:bg-white hover:shadow-sm'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-inner transition
                            ${isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500'}`}>
                          {firstLetter}
                        </div>
                        <span className={`text-xs font-bold truncate transition ${isSelected ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'}`}>
                            {group.name}
                        </span>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                          <CheckCircle2 size={16} className="text-white drop-shadow-sm" />
                      </div>
                    </div>
                );
             })
          )}
        </div>

        <div className="p-3 bg-white/50 border-t border-gray-100">
          <button 
            disabled={selectedGroups.length === 0}
            onClick={handleSend}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-lg
                ${selectedGroups.length > 0 
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white hover:shadow-blue-200 hover:scale-[1.02] active:scale-95' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <Send size={14} /> 
            {selectedGroups.length > 0 ? `Send to ${selectedGroups.length}` : 'Select a group'}
          </button>
        </div>
      </div>
    </div>
  );
}