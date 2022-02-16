// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import '../types';

export type LogoutApiArgs = {
  // such as: http://localhost:3000/
  redirectUri: string;
  // such as: https://remix.authing.cn
  appDomain: string;
};

export function createLogoutApi({ appDomain, redirectUri }: LogoutApiArgs) {
  return function handler(req: NextApiRequest, res: NextApiResponse): void {
    const { redirect } = req.query;
    if (redirect) {
      const params = new URLSearchParams({
        redirect_uri: redirectUri
      });
      res.redirect(
        302,
        `${appDomain}/login/profile/logout?${params.toString()}`
      );
      return;
    }
    req.session?.destroy?.();
    res.redirect(302, `${req.url!}?redirect=true`);
  };
}
