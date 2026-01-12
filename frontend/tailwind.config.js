module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark gamification theme
        'game-bg': '#0B0B0F',
        'game-card': '#141420',
        'game-accent': '#00E5FF',
        'game-success': '#39FF14',
        'game-reward': '#F5C542',
        'game-error': '#FF3B3B',
        'game-text': '#FFFFFF',
        'game-secondary': '#A0A0B2',
        'game-muted': '#6B6B80',
        indigo: {
          50: '#f0f4ff',
          100: '#e5e7fb',
          600: '#6c47ff',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          600: '#4b5563',
          900: '#111827',
        },
        green: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      scale: {
        '105': '1.05',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)' },
        },
        'xp-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)' },
          '50%': { boxShadow: '0 0 16px rgba(57, 255, 20, 0.8)' },
        },
        'reward-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245, 197, 66, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(245, 197, 66, 0.7)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'xp-pulse': 'xp-pulse 1.5s ease-in-out infinite',
        'reward-glow': 'reward-glow 1.8s ease-in-out infinite',
      },
    },
    },
  },
  plugins: [],
}
