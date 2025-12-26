import React from 'react';
import { Shield, ShieldCheck, AlertCircle, Crown, Briefcase, User } from 'lucide-react';

export const getRoleStyle = (role, status) => {
  if (status !== 'active') {
    return { 
      bg: 'bg-red-500', text: 'text-white', border: 'border-red-200', 
      icon: <AlertCircle size={14} />, label: 'Inactive' 
    };
  }
  switch(role) {
    case 'admin': 
      return { bg: 'bg-black', text: 'text-white', border: 'border-gray-800', icon: <ShieldCheck size={14} />, label: 'Admin' };
    case 'assistant_admin': 
      return { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500', icon: <Crown size={14} />, label: 'Asst. Admin' };
    case 'co_admin': 
      return { bg: 'bg-amber-900', text: 'text-white', border: 'border-amber-950', icon: <Crown size={14} />, label: 'Co-Admin' };
    case 'leader': 
      return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-200', icon: <Shield size={14} />, label: 'Leader' };
    case 'group_leader':
      return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-200', icon: <Briefcase size={14} />, label: 'Group Lead' };
    case 'rater': 
      return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-200', icon: <User size={14} />, label: 'Rater' };
    default: 
      return { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-200', icon: <User size={14} />, label: 'User' };
  }
};