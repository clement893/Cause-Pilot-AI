"use client";

interface CausePilotAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

export default function CausePilotAvatar({ 
  size = "md", 
  animated = true,
  className = "" 
}: CausePilotAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Glow effect */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-md opacity-50 animate-pulse" />
      )}
      
      {/* Avatar container */}
      <div className="relative w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-full p-0.5 shadow-lg">
        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
          {/* Robot face SVG */}
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head background */}
            <circle cx="50" cy="50" r="40" fill="url(#headGradient)" />
            
            {/* Face plate */}
            <ellipse cx="50" cy="52" rx="32" ry="30" fill="#1e293b" />
            
            {/* Left eye */}
            <g className={animated ? "animate-blink" : ""}>
              <ellipse cx="35" cy="45" rx="10" ry="12" fill="#0f172a" />
              <ellipse cx="35" cy="45" rx="7" ry="9" fill="url(#eyeGradient)" />
              <circle cx="37" cy="43" r="3" fill="white" opacity="0.8" />
            </g>
            
            {/* Right eye */}
            <g className={animated ? "animate-blink" : ""}>
              <ellipse cx="65" cy="45" rx="10" ry="12" fill="#0f172a" />
              <ellipse cx="65" cy="45" rx="7" ry="9" fill="url(#eyeGradient)" />
              <circle cx="67" cy="43" r="3" fill="white" opacity="0.8" />
            </g>
            
            {/* Smile */}
            <path
              d="M 32 62 Q 50 78 68 62"
              stroke="url(#smileGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Antenna */}
            <line x1="50" y1="10" x2="50" y2="18" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="8" r="4" fill="#ec4899" className={animated ? "animate-pulse" : ""} />
            
            {/* Ear pieces */}
            <rect x="8" y="42" width="8" height="16" rx="3" fill="url(#headGradient)" />
            <rect x="84" y="42" width="8" height="16" rx="3" fill="url(#headGradient)" />
            
            {/* Gradients */}
            <defs>
              <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="smileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Online indicator */}
      {animated && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
      )}
    </div>
  );
}
