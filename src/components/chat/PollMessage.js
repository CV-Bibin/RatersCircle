import React from 'react';
import { CheckCircle, XCircle, BarChart2, Eye, Lock, Users } from 'lucide-react';

export default function PollMessage({ msg, currentUser, onVote, onReveal, userProfiles, userRole }) {
  // 1. DATA EXTRACTION (SAFE MODE)
  const poll = msg.poll || {};
  
  // 🛡️ CRITICAL FIX: Handle if Firebase returns options as an Object instead of Array
  const rawOptions = poll.options || [];
  const options = Array.isArray(rawOptions) ? rawOptions : Object.values(rawOptions);

  const totalVotes = options.reduce((acc, opt) => acc + (opt.voteCount || 0), 0);
  
  // 2. USER STATUS
  const userVoteOptionId = poll.votes ? poll.votes[currentUser.uid] : null; 
  const hasVoted = userVoteOptionId !== undefined && userVoteOptionId !== null;
  
  // 3. PERMISSIONS
  const isCreator = msg.senderId === currentUser.uid;
  const finalRole = userRole || currentUser?.role;
  const ALLOWED_ROLES = ['admin', 'co_admin', 'assistant_admin', 'leader', 'group_leader'];
  const isLeadership = ALLOWED_ROLES.includes(finalRole);
  const canViewReport = isLeadership || isCreator;
  const canReveal = canViewReport && poll.isQuiz && !poll.isRevealed;

  // 4. GENERATE REPORT DATA
  const getBreakdown = () => {
    if (!poll.votes) return { correct: [], wrong: [] };
    const breakdown = { correct: [], wrong: [] };

    Object.entries(poll.votes).forEach(([uid, optionId]) => {
      let name = "Unknown";
      if (uid === currentUser.uid) {
          name = "You";
      } else if (userProfiles && userProfiles[uid]) {
          name = userProfiles[uid].displayName || userProfiles[uid].email?.split('@')[0];
      }
      
      if (optionId === poll.correctOptionId) {
        breakdown.correct.push(name);
      } else {
        breakdown.wrong.push(name);
      }
    });
    return breakdown;
  };

  const reportData = canViewReport ? getBreakdown() : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm w-full min-w-[250px] max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-gray-800 text-sm leading-tight">{poll.question}</h4>
        <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shrink-0">
          <BarChart2 size={16} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {poll.isQuiz ? "Quiz Mode" : "Public Poll"}
        </span>
        <span className="text-[10px] text-gray-300">•</span>
        <span className="text-[10px] text-gray-500 font-medium">{totalVotes} votes</span>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {options.map((opt) => {
          const percentage = totalVotes === 0 ? 0 : Math.round(((opt.voteCount || 0) / totalVotes) * 100);
          const isSelected = userVoteOptionId === opt.id;
          
          let statusColor = "bg-white border-gray-200"; 
          let progressColor = "bg-gray-100"; 
          let textColor = "text-gray-700";
          let icon = null;

          if (poll.isRevealed) {
            if (opt.id === poll.correctOptionId) {
              statusColor = "border-green-500 bg-green-50";
              progressColor = "bg-green-200";
              icon = <CheckCircle size={14} className="text-green-600" />;
            } else if (isSelected) {
              statusColor = "border-red-300 bg-red-50";
              progressColor = "bg-red-200";
              icon = <XCircle size={14} className="text-red-500" />;
            }
          } 
          else if (isSelected) {
             statusColor = "border-blue-500 bg-blue-50";
             progressColor = "bg-blue-200";
             textColor = "text-blue-700";
             icon = <CheckCircle size={14} className="text-blue-600" />;
          }

          return (
            <button 
              key={opt.id}
              disabled={hasVoted && !poll.allowVoteChange}
              onClick={() => onVote(msg.id, opt.id)}
              className={`relative w-full text-left p-2.5 rounded-xl border transition-all duration-200 overflow-hidden group 
                ${hasVoted && !poll.allowVoteChange ? 'cursor-default' : 'hover:border-blue-300 active:scale-[0.98] cursor-pointer'} 
                ${statusColor}`}
            >
              {hasVoted && (
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 opacity-50 ${progressColor}`} 
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative z-10 flex justify-between items-center text-sm">
                <span className={`font-semibold flex items-center gap-2 ${textColor}`}>
                   {opt.text} {icon}
                </span>
                {hasVoted && <span className="text-xs font-bold text-gray-500">{percentage}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      {canReveal && (
        <button 
          onClick={() => onReveal(msg.id)}
          className="mt-4 w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-black transition shadow-lg"
        >
          <Eye size={14} /> Reveal Answer
        </button>
      )}

      {/* Report Section */}
      {canViewReport && poll.isRevealed && (
        <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 p-3 rounded-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-1.5 mb-2">
             <div className="p-1 bg-gray-200 rounded text-gray-600"><Users size={12} /></div>
             <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
               {isCreator ? "My Quiz Report" : "Leadership Report"}
             </h5>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase mb-0.5">
                <CheckCircle size={10} /> CORRECT ({reportData.correct.length})
              </span> 
              <div className="text-[11px] text-gray-700 leading-tight bg-white p-2 rounded border border-gray-100 min-h-[30px] flex items-center">
                {reportData.correct.length > 0 ? reportData.correct.join(', ') : <span className="text-gray-400 italic">No one yet</span>}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase mb-0.5">
                <XCircle size={10} /> WRONG ({reportData.wrong.length})
              </span> 
              <div className="text-[11px] text-gray-700 leading-tight bg-white p-2 rounded border border-gray-100 min-h-[30px] flex items-center">
                {reportData.wrong.length > 0 ? reportData.wrong.join(', ') : <span className="text-gray-400 italic">No one yet</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-2 flex justify-between items-center px-1">
         {!hasVoted ? (
             <p className="text-[10px] text-gray-400 italic">Select an option to vote</p>
         ) : (
             <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                 <CheckCircle size={10} /> Vote Recorded
             </p>
         )}
         {hasVoted && !poll.allowVoteChange && (
             <p className="text-[10px] text-gray-400 flex items-center gap-1"><Lock size={10} /> Locked</p>
         )}
      </div>
    </div>
  );
}