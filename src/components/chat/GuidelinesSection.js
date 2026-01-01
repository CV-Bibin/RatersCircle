import React, { useState } from 'react';
import { Search, FileText, Plus, X, Eye, Lock, UploadCloud, Star, AlertCircle, Tag } from 'lucide-react';

export default function GuidelinesSection({ userRole }) {
  // --- STATE ---
  const [guidelineSearch, setGuidelineSearch] = useState('');
  const [selectedGuidelineTag, setSelectedGuidelineTag] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload Modal State
  const [uploadTag, setUploadTag] = useState('Search 2.0');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

  // Check Permissions
  const canUpload = ['admin', 'co_admin', 'assistant_admin', 'leader'].includes(userRole);

  // --- DATA ---
  const initialTaskTypes = ['Search 2.0', 'Auto Complete', 'Poi evaluation', 'Side by side', 'Freshness'];
  const filterOptions = ['All', ...initialTaskTypes];

  const allGuidelines = [
    { id: 101, title: 'Search 2.0 SOP 2025', date: 'Jan 10, 2025', pinned: true, tag: 'Search 2.0' },
    { id: 102, title: 'POI Verification Rules', date: 'Dec 22, 2024', pinned: true, tag: 'Poi evaluation' },
    { id: 103, title: 'Auto Complete formatting', date: 'Oct 05, 2024', pinned: false, tag: 'Auto Complete' },
    { id: 104, title: 'SxS Preference Logic', date: 'Sep 12, 2024', pinned: false, tag: 'Side by side' },
  ];

  // --- FILTER LOGIC ---
  const filteredGuidelines = allGuidelines
    .filter(doc => {
      const matchesTag = selectedGuidelineTag === 'All' || doc.tag === selectedGuidelineTag;
      const matchesSearch = doc.title.toLowerCase().includes(guidelineSearch.toLowerCase());
      return matchesTag && matchesSearch;
    })
    .sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1));

  return (
    <div className="flex-1 flex flex-col min-h-0 pt-2 px-6 bg-white overflow-hidden pb-2 border-t border-gray-50">
       
       {/* Header Row */}
       <div className="flex justify-between items-center mb-3 shrink-0">
          <label className="text-xs font-bold text-gray-400 uppercase">Guidelines</label>
          {canUpload && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1 text-[10px] font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition shadow-sm"
            >
              <Plus size={12}/> Upload
            </button>
          )}
       </div>

       {/* PILL FILTERS */}
       <div className="flex gap-2 overflow-x-auto pb-2 mb-2 shrink-0 [&::-webkit-scrollbar]:hidden">
          {filterOptions.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedGuidelineTag(tag)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition border ${
                selectedGuidelineTag === tag 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
       </div>

       {/* Search Input */}
       <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-purple-100 transition mb-3 shrink-0">
          <Search size={14} className="text-gray-400" />
          <input 
             type="text" 
             value={guidelineSearch}
             onChange={(e) => setGuidelineSearch(e.target.value)}
             placeholder="Filter by name..." 
             className="bg-transparent border-none outline-none text-xs ml-2 w-full text-gray-700 placeholder-gray-400" 
          />
       </div>

       {/* LIST AREA */}
       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-4">
          {filteredGuidelines.length > 0 ? filteredGuidelines.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:bg-purple-50 hover:border-purple-100 transition cursor-pointer relative">
               {doc.pinned && (
                 <div className="absolute top-2 right-2 text-yellow-500">
                   <Star size={10} fill="currentColor"/>
                 </div>
               )}
               
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                     <FileText size={16}/>
                  </div>
                  <div className="min-w-0">
                     <p className="text-sm font-bold text-gray-700 truncate group-hover:text-purple-700 transition pr-4">{doc.title}</p>
                     <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-gray-400">{doc.date}</p>
                        <span className="bg-white border border-gray-200 text-gray-500 px-1.5 rounded-[4px] text-[9px] uppercase font-bold tracking-wide">
                          {doc.tag}
                        </span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-white rounded-lg transition" title="Read Only">
                     <Eye size={16}/>
                  </button>
                  {!doc.pinned && <Lock size={12} className="text-gray-300"/>}
               </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                 <AlertCircle size={24} className="text-gray-300"/>
               </div>
               <p className="text-sm font-bold text-gray-500">No guidelines found</p>
            </div>
          )}
       </div>

       {/* UPLOAD MODAL */}
       {showUploadModal && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-3xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800">Upload Guideline</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
           </div>
           
           <div className="flex-1 flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer group">
                 <UploadCloud size={24} className="text-blue-500 mb-2 group-hover:scale-110 transition"/>
                 <p className="text-sm font-bold text-gray-600">Browse file</p>
                 <p className="text-[10px] text-gray-400">PDF, DOCX</p>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Task Category</label>
                 {!isCreatingTag ? (
                   <div className="relative">
                      <select 
                        value={uploadTag}
                        onChange={(e) => {
                           if(e.target.value === 'NEW') setIsCreatingTag(true);
                           else setUploadTag(e.target.value);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold py-3 pl-3 pr-8 rounded-xl outline-none appearance-none cursor-pointer"
                      >
                        {initialTaskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="NEW" className="text-blue-600 font-bold">+ Create New Tag...</option>
                      </select>
                      <Tag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                   </div>
                 ) : (
                   <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                      <input 
                        type="text" 
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        placeholder="Enter new task name..."
                        className="flex-1 bg-white border-2 border-blue-500 rounded-xl px-3 py-2 text-sm outline-none font-bold text-gray-800"
                        autoFocus
                      />
                      <button onClick={() => setIsCreatingTag(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600"><X size={16}/></button>
                   </div>
                 )}
              </div>
              <textarea placeholder="Description..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-20 resize-none outline-none focus:border-blue-300"/>
           </div>

           <div className="flex gap-3 mt-4">
              <button onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl">Cancel</button>
              <button className="flex-1 py-3 text-sm font-bold text-white bg-black rounded-xl shadow-lg">Upload</button>
           </div>
        </div>
       )}
    </div>
  );
}