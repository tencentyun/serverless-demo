
import { createLoginApi } from '@authing/nextjs'
import { appDomain, clientId, redirectUri } from '../../config'

export default createLoginApi({
  appDomain,
  clientId,
  redirectUri,
  scope: 'openid roles username phone profile'
});