// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  vite: {
    server: {
        proxy: {
            '/offer': 'http://localhost:8080/'
        }
    }
},

  modules: ['@nuxtjs/tailwindcss']
})