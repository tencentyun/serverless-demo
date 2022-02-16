import { withIronSessionApiRoute } from 'iron-session/next'
import { createLogoutApi } from '@authing/nextjs'
import { appDomain, logoutRedirectUri, sessionOptions } from '../../config'

export default withIronSessionApiRoute(
  createLogoutApi({
    appDomain,
    redirectUri: logoutRedirectUri
  }),
  sessionOptions
);