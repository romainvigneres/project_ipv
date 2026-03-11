/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'sans-serif'],
      },
      colors: {
        // brand tokens remapped to Stelliant palette
        brand: {
          50:  '#f0f2f8',
          100: '#d6dced',
          200: '#b0bede',
          500: '#39A1FF',  // bleu-ciel — focus rings, spinners
          600: '#15347A',  // bleu-roi — buttons, active states
          700: '#171D3F',  // bleu-nuit — navbar, hero backgrounds
          900: '#0d1126',
        },
        // Full Stelliant palette
        stelliant: {
          'bleu-nuit': '#171D3F',
          'bleu-roi':  '#15347A',
          'bleu-ciel': '#39A1FF',
          jaune:       '#F7C800',
          orange:      '#FA8531',
          fushia:      '#EA249E',
          violet:      '#7238F7',
          vert:        '#12D859',
          gris:        '#4F4E4E',
        },
      },
    },
  },
  plugins: [],
}
