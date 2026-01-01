import React, { useMemo } from "react";
// ✅ UPDATED IMPORTS: All the icons from your Member List logic
import { 
  // Admin Icons (Kept existing ones)
  Crown, Gem, ShieldCheck, Trophy, Award, 
  // Leader Icons (The strict 10 you wanted)
  Flag, Compass, Megaphone, Lightbulb, Zap, Target, Dumbbell, GraduationCap, Gavel,
  // Rater Icons (The Office/Work set)
  Laptop, Monitor, Mouse, Gamepad2, Book, Stamp, Briefcase, Keyboard, Headphones, Coffee, FileText, ClipboardList,
  // User/Default Icons
  Anchor, Sun, Moon, Music, Heart 
} from "lucide-react";

import { getUserLevel } from "../../utils/LevelSystem"; 

export default function AnimeDP({ seed, role, xp = 0, size = 48 }) {
  
  // 1. Calculate Level & Progress
  const levelData = useMemo(() => getUserLevel(xp), [xp]);
  
  // 2. Avatar Data (Icons/Colors)
  const avatarData = useMemo(() => {
    let hash = 0;
    const input = seed || "guest";
    for (let i = 0; i < input.length; i++) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash);

    // --- ICON SETS ---
    const adminIcons = [Crown, Gem, ShieldCheck, Trophy, Award];
    
    // ✅ LEADER ICONS: Matches your Member List (NO ROCKET)
    const leaderIcons = [
        Flag, Compass, Megaphone, Trophy, Lightbulb, 
        Zap, Target, Dumbbell, GraduationCap, Gavel
    ];

    // ✅ RATER ICONS: Matches your Member List (Office/Work)
    const raterIcons = [
        Laptop, Monitor, Mouse, Gamepad2, Book, Stamp, 
        Briefcase, Keyboard, Headphones, Coffee, FileText, ClipboardList
    ];

    const userIcons = [Anchor, Coffee, Sun, Moon, Music, Heart];

    let iconList, bgClass;

    // --- ROLE LOGIC ---
    switch (role) {
      case "admin": iconList = adminIcons; bgClass = "bg-black"; break;
      case "co_admin": iconList = adminIcons; bgClass = "bg-[#5d4037]"; break;
      
      // Both Leader types share the "Leader Icons" list
      case "leader": 
      case "group_leader": iconList = leaderIcons; bgClass = "bg-purple-800"; break;
      
      case "rater": iconList = raterIcons; bgClass = "bg-green-900"; break; 
      
      default: iconList = userIcons; bgClass = "bg-blue-800"; break;
    }

    return { IconComponent: iconList[index % iconList.length], bgClass };
  }, [seed, role]);

  const { IconComponent, bgClass } = avatarData;

  // --- SVG CONFIG FOR PROGRESS RING ---
  const strokeWidth = 3;
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Calculate how much line to draw based on percentage
  const strokeDashoffset = circumference - (levelData.percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      
      {/* 1. PROGRESS RING (Only for Raters) */}
      {role === 'rater' && (
        <svg className="absolute inset-0 -rotate-90 transform" width={size} height={size}>
          {/* Background Circle (Gray track) */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="#e5e7eb" strokeWidth={strokeWidth} fill="transparent"
          />
          {/* Progress Circle (Colored) */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={levelData.color} 
            strokeWidth={strokeWidth} 
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      )}

      {/* 2. INNER AVATAR CIRCLE */}
      {/* We make it slightly smaller to fit inside the SVG ring */}
      <div 
        className={`flex items-center justify-center rounded-full ${bgClass} shadow-inner`}
        style={{ width: size - (strokeWidth * 3), height: size - (strokeWidth * 3) }}
      >
        <IconComponent 
          size={(size - 6) * 0.55} 
          color="white" 
          strokeWidth={2.5}
          className="drop-shadow-md"
        />
        
        {/* Glass Shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none scale-90" />
      </div>

      {/* 3. LEGENDARY GLOW (Optional) */}
      {role === 'rater' && levelData.isLegendary && (
         <div className="absolute inset-0 rounded-full ring-2 ring-yellow-400 animate-pulse pointer-events-none" />
      )}

    </div>
  );
}