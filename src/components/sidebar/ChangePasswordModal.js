import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';

export default function ChangePasswordModal({ onClose }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setMsg(null);

    if (newPass.length < 6) return setError("Password must be at least 6 characters.");
    if (newPass !== confirmPass) return setError("Passwords do not match.");

    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPass);
        setMsg("Password updated successfully!");
        setTimeout(() => onClose(), 1500); // Close after success
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
          setError("For security, please logout and login again before changing your password.");
        } else {
          setError("Error: " + err.message);
        }
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Change Password</h3>
      
      {error && <div className="bg-red-50 text-red-500 p-2 rounded text-xs mb-3 w-full text-center">{error}</div>}
      {msg && <div className="bg-green-50 text-green-500 p-2 rounded text-xs mb-3 w-full text-center">{msg}</div>}

      <input 
        type="password"
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-3 outline-none focus:border-blue-500 text-sm"
        placeholder="New Password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
      />
      <input 
        type="password"
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4 outline-none focus:border-blue-500 text-sm"
        placeholder="Confirm Password"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
      />
      
      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 py-3 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm">Cancel</button>
        <button onClick={handleSubmit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm">Update</button>
      </div>
    </div>
  );
}