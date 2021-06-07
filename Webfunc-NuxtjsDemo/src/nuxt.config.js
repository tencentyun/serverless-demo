export default {
  env: {
    STATIC_URL: process.env.STATIC_URL || ''
  },
  /*
   ** Build configuration
   */
  build: {
    extend(config, { isDev, isClient }) {
      if (!isDev && process.env.STATIC_URL) {
        config.output.publicPath = process.env.STATIC_URL
      }
    }
  },
  /*
   ** Headers of the page
   */
  head: {
    title: 'Serverless - Nuxt.js Application',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Serverless Nuxt.js 应用'
      },
      {
        hid: 'keywords',
        name: 'keywords',
        content: 'nuxt,nuxt.js,serverless,无服务'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: `${process.env.STATIC_URL || ''}/favicon.ico` }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [],
  /*
   ** Nuxt.js modules
   */
  modules: []
}
