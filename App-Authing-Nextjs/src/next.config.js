const isProd = process.env.NODE_ENV === 'production'

console.log(process.version);

module.exports = {
  reactStrictMode: true,
  env: {
    STATIC_URL: isProd ? process.env.STATIC_URL : ''
  },
  assetPrefix: isProd ? process.env.STATIC_URL : ''
}
