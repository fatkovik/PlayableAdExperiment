import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    outDir: 'C:/Users/ghaza/Desktop/PlayableAd/docs',
  },
})
