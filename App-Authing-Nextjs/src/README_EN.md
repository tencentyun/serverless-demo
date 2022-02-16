# @authing/nextjs

[![npm](https://img.shields.io/npm/v/@authing/nextjs.svg)](https://npmjs.org/package/@authing/nextjs) [![npm](https://img.shields.io/npm/dt/@authing/nextjs.svg)](https://npmjs.org/package/@authing/nextjs)

[中文说明](./README.md)

Simple Authing OIDC Authentication for Next.js

Notice: This App Demo requires Node.js 14.13 or above.

- [@authing/nextjs](#authingnextjs)
  - [Functions](#functions)
    - [isAuthenticated](#isauthenticated)
  - [API Helpers](#api-helpers)
    - [createCallbackApi](#createcallbackapi)
    - [createLoginApi](#createloginapi)
    - [createLogoutApi](#createlogoutapi)
  - [Quick Start](#quick-start)
    - [Add dependencies](#add-dependencies)
    - [Config](#config)
    - [Create SessionStorage](#create-sessionstorage)
    - [Create Login, Logout, Callback APIs](#create-login-logout-callback-apis)
    - [Use in SSR](#use-in-ssr)
    - [Use in SSG](#use-in-ssg)
  - [Others](#others)
  - [LICENSE](#license)

## Functions

### isAuthenticated

```ts
type IsAuthenticatedOptions = {
  throwOnError?: boolean;
};

function isAuthenticated<User = any>(
  req: NextApiRequest,
  options?: IsAuthenticatedOptions
): User;
```

Params:

- `throwOnError`: throw error when not authenticated

Return Type: `User`

## API Helpers

### createCallbackApi

```ts
type CallbackApiArgs = {
  appDomain: string;
  clientId: string;
  clientSecret: string;
  failureRedirect?: string;
  successRedirect?: string;
};

function createCallbackApi({
  appDomain,
  clientId,
  clientSecret,
  failureRedirect,
  successRedirect
}: CallbackApiArgs): (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void>;
```

Params:

- `appDomain`: App Domain, like: `https://your-app.authing.cn`
- `clientId`: App ID
- `clientSecret`: App Secret
- `failureRedirect`: redirect when failed, such as `/error`
- `successRedirect`: redirect when success, such as `/dashboard`

### createLoginApi

```ts
type LoginApiArgs = {
  appDomain: string;
  clientId: string;
  redirectUri: string;
  scope: string;
};

function createLoginApi({
  appDomain,
  clientId,
  redirectUri,
  scope
}: LoginApiArgs): (req: NextApiRequest, res: NextApiResponse) => void;
```

Params:

- `appDomain`: App Domain, like: `https://your-app.authing.cn`
- `clientId`: App ID
- `redirectUri`: Callback Redirect URI (same with Authing console configuration)
- `sope`: OAuth Scope, like: `openid profile email`
  - Ref: [Documentation](https://docs.authing.cn/v2/concepts/oidc-common-questions.html#scope-%E5%8F%82%E6%95%B0%E5%AF%B9%E5%BA%94%E7%9A%84%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF)

### createLogoutApi

```ts
type LogoutApiArgs = {
  redirectUri: string;
  appDomain: string;
};

function createLogoutApi({
  appDomain,
  redirectUri
}: LogoutApiArgs): (req: NextApiRequest, res: NextApiResponse) => void;
```

Params:

- `appDomain`: App Domain, like: `https://your-app.authing.cn`
- `redirectUri`: Logout Callback Redirect URI (same in authing console)

## Quick Start

Example project at `examples/basic`.

### Add dependencies

```bash
npm install --save @authing/nextjs iron-session swr
# or
yarn add @authing/nextjs iron-session swr
```

### Config

Placed in `config/index.ts` or somewhere else.

```ts
export const clientId =
  process.env.AUTHING_CLIENT_ID || '61e4da899687d7055442f6b7';
export const clientSecret = process.env.AUTHING_CLIENT_SECRET || '';
export const appDomain =
  process.env.AUTHING_CLIENT_DOMAIN || 'https://remix.authing.cn';
export const redirectUri =
  process.env.AUTHING_REDIRECT_URI || 'http://localhost:3000/authing/callback';
export const logoutRedirectUri =
  process.env.AUTHING_LOGOUT_REDIRECT_URI || 'http://localhost:3000/';
```

### Create SessionStorage

Create `lib/session.ts`. In this example we use `iron-session` to store session.

### Create Login, Logout, Callback APIs

Notice that login url is `/api/login`, and logout is `/api/logout`

Create `pages/api/login.ts`:

```ts
import { createLoginApi } from '@authing/nextjs';
import { appDomain, clientId, redirectUri } from '../../config';

export default createLoginApi({
  appDomain,
  clientId,
  redirectUri,
  scope: 'openid roles username phone profile'
});
```

Create `pages/api/logout.ts`:

```ts
import { withIronSessionApiRoute } from 'iron-session/next';
import { createLogoutApi } from '@authing/nextjs';
import { appDomain, logoutRedirectUri } from '../../config';
import { sessionOptions } from '../../lib/session';

export default withIronSessionApiRoute(
  createLogoutApi({
    appDomain,
    redirectUri: logoutRedirectUri
  }),
  sessionOptions
);
```

Create `pages/api/callback.ts`:

```ts
import { createCallbackApi } from '@authing/nextjs';
import { appDomain, clientId, clientSecret } from '../../config';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';

export default withIronSessionApiRoute(
  createCallbackApi({
    appDomain,
    clientId,
    clientSecret,
    // 登录失败返回登录页
    failureRedirect: '/error',
    successRedirect: '/ssr'
  }),
  sessionOptions
);
```

### Use in SSR

```ts
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '../lib/session';

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res
}) {
  const user = req.session.user;

  if (user === undefined) {
    res.setHeader('location', '/api/login');
    res.statusCode = 302;
    res.end();
    return {
      props: {
        user: { isLoggedIn: false }
      }
    };
  }

  return {
    props: { user: req.session.user }
  };
},
sessionOptions);
```

### Use in SSG

Create API: `pages/api/me.ts`:

```ts
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export type User = {
  isLoggedIn: boolean;
  username: string;
};

export default withIronSessionApiRoute(userRoute, sessionOptions);

async function userRoute(req: NextApiRequest, res: NextApiResponse<User>) {
  if (req.session.user) {
    // in a real world application you might read the user id from the session and then do a database request
    // to get more information on the user if needed
    res.json({
      ...req.session.user,
      isLoggedIn: true
    });
  } else {
    res.json({
      isLoggedIn: false,
      username: ''
    });
  }
}
```

Create React hook `hooks/use-user.ts`:

```ts
import { useEffect } from 'react';
import Router from 'next/router';
import useSWR from 'swr';
import { User } from '../pages/api/me';

export default function useUser({
  redirectTo = '',
  redirectIfFound = false
} = {}) {
  const { data: user, error } = useSWR<User>('/api/me');

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user?.isLoggedIn)
    ) {
      Router.push(redirectTo);
    }
  }, [user, redirectIfFound, redirectTo]);

  return { user, error };
}
```

Create page `pages/sg.tsx`:

```ts
import useUser from '../hooks/use-user';
import Link from 'next/link';

// Make sure to check https://nextjs.org/docs/basic-features/layouts for more info on how to use layouts
export default function SgProfile() {
  const { user } = useUser({
    redirectTo: '/api/login'
  });

  return (
    <>
      <nav>
        <Link href='/ssr'>SSR</Link> | <Link href='/api/logout'>Logout</Link>
      </nav>
      {user && (
        <>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </>
      )}
    </>
  );
}
```

## Others

- [@authing/remix](https://github.com/Authing/authing-remix)

## LICENSE

MIT