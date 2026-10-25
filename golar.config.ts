import { defineConfig } from 'golar/unstable'
import '@golar/vue'

export default defineConfig({
	typecheck: {
		include: ["app/**/*.{ts,tsx,vue}", "shared/**/*.{ts,tsx,vue}", ".nuxt/types/**/*.d.ts"],
	},
})
