const Logo = ({ size = "md", className = "" }) => {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24"
    };

    return (
        <div className={`${sizes[size]} ${className} relative`}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Gradient Definitions */}
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                </defs>
                
                {/* Background Circle */}
                <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1" />
                
                {/* Pi Symbol - Top */}
                <path 
                    d="M30 35 L30 50 M70 35 L70 50 M25 35 L75 35" 
                    stroke="url(#logoGradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Sigma Symbol - Bottom */}
                <path 
                    d="M30 65 L50 65 L35 75 L50 85 L30 85" 
                    stroke="url(#logoGradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
                
                {/* Integration Symbol */}
                <path 
                    d="M62 65 Q 58 70, 58 75 T 62 85" 
                    stroke="#F59E0B" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    fill="none"
                />
                
                {/* Plus Symbol - Accent */}
                <circle cx="72" cy="70" r="2" fill="#4F46E5" />
                <circle cx="72" cy="80" r="2" fill="#F59E0B" />
            </svg>
        </div>
    );
};

export default Logo;
