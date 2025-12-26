// src/components/Signup.js
import React, { useState } from 'react';
import { auth, database } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export default function Signup({ switchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save User Details to Realtime Database with "Pending" status
      await set(ref(database, 'users/' + user.uid), {
        email: user.email,
        role: 'rater',      // Default role
        status: 'pending',   // <--- IMPORTANT: Admin must approve this later
        createdAt: Date.now()
      });

      setMsg("Registration successful! Please wait for Admin approval.");
      setError(null);
    } catch (err) {
      setError(err.message);
      setMsg(null);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#EAF2F8]">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Request Account</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {msg && <div className="bg-green-100 text-green-600 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" required 
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" required 
          />
          <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700">
            Register
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500 cursor-pointer hover:underline" onClick={switchToLogin}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}