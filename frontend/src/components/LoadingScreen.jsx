import { useTheme } from '../context/ThemeContext'

export default function LoadingScreen() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="relative w-64 h-64">
        {/* Outer animated circle */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 border-r-violet-500 animate-spin"></div>
        
        {/* Middle animated circle */}
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-violet-400 border-l-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Inner animated circle */}
        <div className="absolute inset-8 rounded-full border-4 border-transparent border-t-violet-300 border-r-violet-300 animate-spin" style={{ animationDuration: '0.8s' }}></div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent mb-2">
              CampusThread
            </h1>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Loading...
            </p>
          </div>
        </div>

        {/* Floating dots */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
