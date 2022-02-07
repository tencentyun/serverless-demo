// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

export type LoginApiArgs = {
  // such as: https://remix.authing.cn
  appDomain: string;
  // such as: 61dcecxxxx318xxxx04acdf5
  clientId: string;
  // such as: http://localhost:3000/authing/callback
  redirectUri: string;
  // ref: https://docs.authing.cn/v2/apn/test-oidc/get-oidc-parameter/step2.html
  scope: string;
};

export function createLoginApi({
  appDomain,
  clientId,
  redirectUri,
  scope
}: LoginApiArgs) {
  return function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ): void {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'code',
      nonce: `${new Date().getTime()}`
    });
    const url = `${appDomain}/oidc/auth?${params.toString()}`;
    res.redirect(302, url);
  };
}
