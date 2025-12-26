import React, { useState } from 'react';
import { X, Plus, CheckCircle, BarChart2, Trash2 } from 'lucide-react';

export default function CreatePollModal({ isOpen, onClose, onCreate }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]); 
  const [correctOptionIndex, setCorrectOptionIndex] = useState(null); 
  const [isQuiz, setIsQuiz] = useState(false);
  const [allowVoteChange, setAllowVoteChange] = useState(true);

  if (!isOpen) return null;

  // Handle text change for a specific option
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Add a new blank option
  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  // Remove an option
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Reset correct answer if the deleted one was selected
      if (correctOptionIndex === index) setCorrectOptionIndex(null); 
      // Adjust index if we deleted an option above the correct one
      else if (correctOptionIndex !== null && index < correctOptionIndex) {
          setCorrectOptionIndex(correctOptionIndex - 1);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Validation
    const validOptions = options.filter(opt => opt.trim() !== "");
    if (!question.trim()) return alert("Please enter a question.");
    if (validOptions.length < 2) return alert("Please provide at least 2 options.");
    if (isQuiz && correctOptionIndex === null) return alert("Please select the correct answer for the quiz.");

    // 2. Construct Poll Data
    const pollData = {
      question,
      options: validOptions.map((text, index) => ({
        id: index, // Simple ID for array index mapping
        text,
        voteCount: 0
      })),
      isQuiz,
      correctOptionId: isQuiz ? correctOptionIndex : null,
      isRevealed: false,
      allowVoteChange: isQuiz ? false : allowVoteChange // Quizzes usually don't allow changing answers
    };

    // 3. Send to Parent
    onCreate(pollData);
    
    // 4. Reset & Close
    setQuestion("");
    setOptions(["", ""]);
    setIsQuiz(false);
    setCorrectOptionIndex(null);
    setAllowVoteChange(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <BarChart2 className="text-blue-500 fill-blue-500/20" /> Create Poll
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition">
            <X size={20}/>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
            
            {/* Question Input */}
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Question</label>
                <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                placeholder="Ask something..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                autoFocus
                />
            </div>

            {/* Options List */}
            <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Options</label>
                {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center group">
                    <div className="relative flex-1">
                        <input 
                            className={`w-full bg-gray-50 border rounded-xl p-3 pl-4 text-sm focus:outline-none focus:ring-2 transition
                                ${isQuiz && correctOptionIndex === idx 
                                    ? 'border-green-500 ring-1 ring-green-500 bg-green-50/50' 
                                    : 'border-gray-200 focus:ring-blue-500'}`}
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                        />
                    </div>
                    
                    {/* Quiz Selector Button */}
                    {isQuiz && (
                        <button 
                            onClick={() => setCorrectOptionIndex(idx)}
                            className={`p-3 rounded-xl transition-all shadow-sm border
                                ${correctOptionIndex === idx 
                                ? 'bg-green-500 text-white border-green-500 scale-105' 
                                : 'bg-white text-gray-300 border-gray-200 hover:border-green-400 hover:text-green-500'}`}
                            title="Mark as Correct Answer"
                        >
                            <CheckCircle size={18} />
                        </button>
                    )}

                    {/* Remove Option Button */}
                    {options.length > 2 && (
                        <button 
                            onClick={() => removeOption(idx)} 
                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100"
                            title="Remove option"
                        >
                            <Trash2 size={18}/>
                        </button>
                    )}
                </div>
                ))}
                
                {options.length < 5 && (
                <button onClick={addOption} className="text-sm text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition w-max">
                    <Plus size={16} /> Add Option
                </button>
                )}
            </div>

            {/* Settings Toggles */}
            <div className="p-4 bg-gray-50 rounded-2xl space-y-3 border border-gray-100">
                
                {/* Quiz Mode */}
                <div className="flex items-center justify-between">
                    <label htmlFor="quizMode" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                        Quiz Mode <span className="text-xs font-normal text-gray-400 block">Select one correct answer</span>
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="quizMode" 
                            id="quizMode" 
                            checked={isQuiz}
                            onChange={(e) => {
                                setIsQuiz(e.target.checked);
                                if (e.target.checked) setAllowVoteChange(false); // Disable vote change for quizzes
                                else setCorrectOptionIndex(null);
                            }}
                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-500 right-5 border-gray-300 transition-all duration-300"
                        />
                        <label htmlFor="quizMode" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${isQuiz ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                    </div>
                </div>

                {/* Allow Vote Change (Hidden if Quiz) */}
                {!isQuiz && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <label htmlFor="allowChange" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                            Allow Vote Change <span className="text-xs font-normal text-gray-400 block">Users can change their answer</span>
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                name="allowChange" 
                                id="allowChange" 
                                checked={allowVoteChange}
                                onChange={(e) => setAllowVoteChange(e.target.checked)}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-500 right-5 border-gray-300 transition-all duration-300"
                            />
                            <label htmlFor="allowChange" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${allowVoteChange ? 'bg-blue-500' : 'bg-gray-300'}`}></label>
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="pt-6 mt-2 border-t border-gray-100">
          <button 
            onClick={handleSubmit}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl hover:bg-black transition shadow-xl shadow-gray-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Create Poll
          </button>
        </div>

      </div>
      
      {/* Simple CSS for toggle switch if tailwind forms plugin isn't active */}
      <style jsx>{`
        .toggle-checkbox:checked {
            right: 0;
            border-color: transparent;
        }
        .toggle-checkbox {
            right: auto;
            left: 0;
            transition: all 0.3s;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: currentColor;
        }
      `}</style>
    </div>
  );
}