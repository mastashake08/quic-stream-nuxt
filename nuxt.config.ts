// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: false,
  app: {
    baseURL: '/quic-stream-nuxt/'
  },
  vite: {
    server: {
        proxy: {
            '/offer': 'http://localhost:8080/'
        }
    }
},

  modules: ['@nuxtjs/tailwindcss']
})