/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx}", // <-- Add this for App Router support
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
		keyframes: {
			shimmer: {
				'0%': { backgroundPosition: '-200%' },
				'100%': { backgroundPosition: '200%' },
			},
		},
		animation: {
			shimmer: 'shimmer 3s linear infinite',
		},
		backgroundSize: {
			'200%': '200%',
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
			primarylight: {
				DEFAULT: 'hsl(var(--primary-light))',
				foreground: 'hsl(var(--primary-foreground))'
			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
			fresh: 'hsl(var(--fresh))',
			rotten: 'hsl(var(--rotten))',
			purple: 'hsl(var(--purple))',
			darkRed: 'hsl(var(--dark-red))',
			lightRed: 'hsl(var(--light-red))',
			orange: 'hsl(var(--orange))',
			yellow: 'hsl(var(--yellow))',
  		},
		fontFamily: {
			sans: ["var(--font-rubik)", "sans-serif"],
		},
		screens: {
			xs: '600px',
		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
