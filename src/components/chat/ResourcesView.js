import React, { useState } from 'react';
import { Search, Filter, Play, Image as ImageIcon, X } from 'lucide-react';
import GuidelinesSection from './GuidelinesSection'; // Import the new component

export default function ResourcesView({ userRole }) {
  // --- STATE ---
  const [answerSearch, setAnswerSearch] = useState('');    
  const [selectedAnswerType, setSelectedAnswerType] = useState('All');
  const [activePreview, setActivePreview] = useState(null); 
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const taskOptions = ['All', 'Search 2.0', 'Auto Complete', 'Poi evaluation', 'Side by side', 'Freshness'];

  // --- DUMMY DATA ---
  const allResults = [
    { id: 1, type: 'video', category: 'Search 2.0', title: 'Ranking relevance guide', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 2, type: 'image', category: 'Auto Complete', title: 'Prefix match examples', url: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Prefix+Examples' },
    { id: 3, type: 'video', category: 'Poi evaluation', title: 'Verifying business hours', url: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  // --- FILTER LOGIC ---
  const filteredAnswers = allResults.filter(item => {
    const matchesType = selectedAnswerType === 'All' || item.category === selectedAnswerType;
    const matchesSearch = item.title.toLowerCase().includes(answerSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const isSearchActive = answerSearch.length > 0 || isSearchFocused;

  return (
    <div className="flex-1 animate-in fade-in duration-300 flex flex-col h-full relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100">
      
      {/* =========================================================================
          TOP: ANSWER SEARCH INPUT
         ========================================================================= */}
      <div className="shrink-0 pt-6 px-6 pb-2 bg-white z-20">
         <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-400 block uppercase">Answer Search</label>
            {isSearchActive && <button onClick={() => {setAnswerSearch(''); setIsSearchFocused(false)}} className="text-[10px] text-blue-500 font-bold hover:underline">Clear</button>}
         </div>
         
         <div className="flex gap-2">
            <div className="relative">
               <select 
                 value={selectedAnswerType}
                 onChange={(e) => setSelectedAnswerType(e.target.value)}
                 className="appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold py-3 pl-3 pr-8 rounded-xl outline-none cursor-pointer hover:bg-gray-100 transition h-full max-w-[100px]"
               >
                 {taskOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
               <Filter size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
            <div className={`flex-1 flex items-center bg-gray-50 rounded-xl px-3 border transition ${isSearchActive ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-100'}`}>
               <Search size={16} className={isSearchActive ? "text-blue-500" : "text-gray-400"} />
               <input 
                 type="text" 
                 value={answerSearch}
                 onFocus={() => setIsSearchFocused(true)}
                 onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                 onChange={(e) => setAnswerSearch(e.target.value)}
                 placeholder="Search answers..." 
                 className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400 h-full py-3" 
               />
            </div>
         </div>
      </div>

      {/* =========================================================================
          MIDDLE: RESULTS AREA (ANIMATED)
         ========================================================================= */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out border-b border-dashed border-gray-200 px-6 bg-white z-10 ${
          isSearchActive ? 'max-h-[40vh] opacity-100 mb-4 py-2' : 'max-h-0 opacity-0 py-0 border-none'
        }`}
      >
        <div className="overflow-y-auto custom-scrollbar h-full pr-1">
           <label className="text-xs font-bold text-blue-500 mb-2 block uppercase flex items-center gap-2">
             Top Matches ({filteredAnswers.length})
           </label>
           
           <div className="space-y-2 pb-2">
             {filteredAnswers.length > 0 ? filteredAnswers.map(res => (
               <div 
                 key={res.id} 
                 onClick={() => setActivePreview(res)}
                 className="group p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition cursor-pointer flex gap-3 items-center"
               >
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${res.type === 'video' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {res.type === 'video' ? <Play size={16} fill="currentColor"/> : <ImageIcon size={16}/>}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600 transition">{res.title}</p>
                   <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{res.category}</p>
                 </div>
               </div>
             )) : (
               <p className="text-center text-gray-400 text-sm py-4 italic">No answers found.</p>
             )}
           </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM: GUIDELINES (Separate Component)
         ========================================================================= */}
      
      <GuidelinesSection userRole={userRole} />


      {/* =========================================================================
          PREVIEW MODAL (Global for this view)
         ========================================================================= */}
      {activePreview && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-3xl">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg truncate pr-4">{activePreview.title}</h3>
              <button onClick={() => setActivePreview(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"><X size={20}/></button>
           </div>
           <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
              {activePreview.type === 'video' ? <video src={activePreview.url} controls className="w-full h-full object-contain" /> : <img src={activePreview.url} alt="Preview" className="w-full h-full object-contain" />}
           </div>
           <div className="mt-4"><span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase tracking-wide">{activePreview.category}</span></div>
        </div>
      )}

    </div>
  );
}