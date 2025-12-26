import React, { useState } from 'react';
import { auth, database } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, push, set } from 'firebase/database';

export default function Login({ switchToSignup }) {
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const snapshot = await get(ref(database, 'users/' + user.uid));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.status !== 'active') {
          await signOut(auth);
          setError("Your account is currently " + userData.status + ".");
          return;
        }
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  // --- PASSWORD RESET REQUEST LOGIC ---
  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email first.");
    
    try {
      // Create a request in the database
      const requestRef = push(ref(database, 'password_reset_requests'));
      await set(requestRef, {
        email: email,
        createdAt: Date.now(),
        status: 'pending'
      });
      setMsg("Request sent! An Admin must approve your password reset.");
      setTimeout(() => setView('login'), 3000);
    } catch (err) {
      setError("Request failed: " + err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#EAF2F8]">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-96">
        
        {/* HEADER */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {view === 'login' ? 'Team Login' : 'Reset Password'}
        </h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {msg && <div className="bg-green-100 text-green-600 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

        {/* LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" required 
            />
            <input 
              type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" required 
            />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700">
              Sign In
            </button>
            
            <div className="flex justify-between mt-4 text-sm">
              <span className="text-gray-500 cursor-pointer hover:underline" onClick={switchToSignup}>Create Account</span>
              <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setView('forgot')}>Forgot Password?</span>
            </div>
          </form>
        )}

        {/* RESET REQUEST FORM */}
        {view === 'forgot' && (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <p className="text-xs text-gray-500 mb-2">
              Enter your email. An Admin must approve this request before you receive a reset link.
            </p>
            <input 
              type="email" placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" required 
            />
            <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-xl font-bold hover:bg-orange-600">
              Send Request
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full text-gray-400 text-sm hover:text-gray-600">
              Cancel
            </button>
          </form>
        )}

      </div>
    </div>
  );
}