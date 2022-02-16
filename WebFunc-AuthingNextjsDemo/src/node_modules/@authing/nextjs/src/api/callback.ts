// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import '../types';

export type CallbackApiArgs = {
  // such as: https://remix.authing.cn
  appDomain: string;
  // such as: 61dcecxxxx318xxxx04acdf5
  clientId: string;
  // such as: 3xx66xxxx2fdxxxx91caxxxxa1xxxxb1
  clientSecret: string;

  // such as: /login
  failureRedirect?: string;
  // such as: /
  successRedirect?: string;
};

export type OidcResponse = {
  error?: string;
  error_description?: string;

  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
};

export function createCallbackApi({
  appDomain,
  clientId,
  clientSecret,
  failureRedirect,
  successRedirect
}: CallbackApiArgs) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> {
    const { code } = req.query;
    if (!code) {
      res.redirect(302, failureRedirect ?? '/login');
      return;
    }

    const body = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code
    };
    const formBody = [];
    // eslint-disable-next-line
    for (const property in body) {
      const encodedKey = encodeURIComponent(property);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const encodedValue = encodeURIComponent(body[property]);
      formBody.push(`${encodedKey}=${encodedValue}`);
    }
    const oidcRes = await fetch(`${appDomain}/oidc/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: formBody.join('&')
    });
    const oidcToken = (await oidcRes.json()) as OidcResponse;
    if (oidcToken.error) {
      console.error(oidcToken);
      res.redirect(302, failureRedirect ?? '/login');
      return;
    }
    const resInfo = await fetch(
      `${appDomain}/oidc/me?access_token=${oidcToken.access_token}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Object.assign(req?.session, { user: await resInfo.json() });
    await req.session?.save?.();
    res.redirect(302, successRedirect ?? '/');
  };
}
