export const clientId =
process.env.AUTHING_CLIENT_ID || '6200b30e1b2a9e50d17b6d07';

export const clientSecret =
process.env.AUTHING_CLIENT_SECRET || 'b615bb111b34c79da2f4c5e226aaf856';

export const appDomain =
process.env.AUTHING_CLIENT_DOMAIN || 'https://tencent-scf-nextjs.authing.cn';

export const redirectUri =
process.env.AUTHING_REDIRECT_URI || 'https://service-117teepy-1251917473.gz.apigw.tencentcs.com/release/api/callback';

export const logoutRedirectUri =
process.env.AUTHING_LOGOUT_REDIRECT_URI || 'https://service-117teepy-1251917473.gz.apigw.tencentcs.com/release/';

export const sessionOptions = {
  password:
    process.env.SECRET_COOKIE_PASSWORD ||
    'authing-nextjs-example-long-password',
  cookieName: 'authing',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production'
  }
};
