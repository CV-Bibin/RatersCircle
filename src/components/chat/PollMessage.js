import React from 'react';
import { CheckCircle, XCircle, BarChart2, Eye } from 'lucide-react';

export default function PollMessage({ msg, currentUser, onVote, onReveal }) {
  const totalVotes = msg.options?.reduce((acc, opt) => acc + (opt.voteCount || 0), 0) || 0;
  
  // Check if current user has voted
  const userVote = msg.votes ? msg.votes[currentUser.uid] : null; // Returns optionId
  const hasVoted = userVote !== undefined && userVote !== null;

  // Can this user reveal? (Creator or Admin)
  const canReveal = (msg.senderId === currentUser.uid || currentUser.role === 'admin') && msg.isQuiz && !msg.isRevealed;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm w-full min-w-[250px] max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-gray-800 text-sm">{msg.question}</h4>
        <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
          <BarChart2 size={16} />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wider">
        {msg.isQuiz ? "Quiz Mode" : "Public Poll"} • {totalVotes} votes
      </p>

      {/* Options List */}
      <div className="space-y-2">
        {msg.options.map((opt) => {
          const percentage = totalVotes === 0 ? 0 : Math.round(((opt.voteCount || 0) / totalVotes) * 100);
          
          // Logic for Quiz Styling
          let statusColor = "bg-gray-100"; // Default Bar Background
          let progressColor = "bg-gray-300"; // Default Progress
          let textColor = "text-gray-700";

          // If Revealed
          if (msg.isRevealed) {
            if (opt.id === msg.correctOptionId) {
              progressColor = "bg-green-500"; // Correct
              statusColor = "bg-green-50 ring-1 ring-green-200";
            } else if (userVote === opt.id) {
              progressColor = "bg-red-400"; // You voted wrong
            }
          } else if (hasVoted && userVote === opt.id) {
             progressColor = "bg-blue-500"; // Your vote (hidden result)
          }

          return (
            <button 
              key={opt.id}
              disabled={hasVoted}
              onClick={() => onVote(msg.id, opt.id)}
              className={`relative w-full text-left p-2 rounded-lg overflow-hidden transition-all group ${hasVoted ? 'cursor-default' : 'hover:bg-gray-50 active:scale-95 cursor-pointer'} ${statusColor}`}
            >
              {/* Progress Bar (Background) */}
              {hasVoted && (
                <div 
                  className={`absolute top-0 left-0 h-full opacity-20 transition-all duration-500 ${progressColor}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              )}

              <div className="relative z-10 flex justify-between items-center text-xs">
                <span className={`font-bold flex items-center gap-2 ${textColor}`}>
                   {opt.text}
                   {/* Show Check/X if Revealed */}
                   {msg.isRevealed && opt.id === msg.correctOptionId && <CheckCircle size={14} className="text-green-600" />}
                   {msg.isRevealed && userVote === opt.id && opt.id !== msg.correctOptionId && <XCircle size={14} className="text-red-500" />}
                </span>
                
                {hasVoted && <span className="text-gray-500 font-mono">{percentage}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / Admin Actions */}
      {canReveal && (
        <button 
          onClick={() => onReveal(msg.id)}
          className="mt-4 w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-black transition shadow-lg"
        >
          <Eye size={14} /> Reveal Answer
        </button>
      )}

      {!hasVoted && (
         <p className="text-center text-[10px] text-gray-400 mt-3 italic">Select an option to see results</p>
      )}
    </div>
  );
}