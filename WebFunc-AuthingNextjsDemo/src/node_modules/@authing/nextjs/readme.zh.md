# @authing/nextjs

[![npm](https://img.shields.io/npm/v/@authing/nextjs.svg)](https://npmjs.org/package/@authing/nextjs) [![npm](https://img.shields.io/npm/dt/@authing/nextjs.svg)](https://npmjs.org/package/@authing/nextjs)

[English](./readme.md)

Simple Authing OIDC Authentication for Next.js

- [@authing/nextjs](#authingnextjs)
  - [实用方法](#实用方法)
    - [isAuthenticated](#isauthenticated)
  - [API 辅助](#api-辅助)
    - [createCallbackApi](#createcallbackapi)
    - [createLoginApi](#createloginapi)
    - [createLogoutApi](#createlogoutapi)
  - [项目示例](#项目示例)
    - [安装依赖](#安装依赖)
    - [配置环境变量](#配置环境变量)
    - [创建 SessionStorage](#创建-sessionstorage)
    - [创建登录、注销和回调 API](#创建登录注销和回调-api)
    - [在 SSR 中使用](#在-ssr-中使用)
    - [在 SSG 中使用](#在-ssg-中使用)
  - [其他](#其他)
  - [LICENSE](#license)

## 实用方法

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

参数说明：

- `throwOnError`： 未登录抛出错误

返回值： `User`

## API 辅助

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

参数说明：

- `appDomain`： 应用域名，如： `https://your-app.authing.cn`
- `clientId`： App ID
- `clientSecret`： App Secret
- `sessionStorage`： Remix SessionStorage
  - 注意：如果是 Remix v1.1.3 及之前版本，请不要使用 CookieSession，会存在 UTF-8 编码解析错误
- `failureRedirect`： 登录失败重定向地址，如：`/error`
- `successRedirect`： 成功重定向地址，如：`/dashboard`

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

参数说明：

- `appDomain`： 应用域名，如： `https://your-app.authing.cn`
- `clientId`： App ID
- `redirectUri`： 登录回调 URL （需要与 Authing 控制台中配置一致）
- `sope`： 授权范围，如：`openid profile email`
  - 参考： [官方文档](https://docs.authing.cn/v2/concepts/oidc-common-questions.html#scope-%E5%8F%82%E6%95%B0%E5%AF%B9%E5%BA%94%E7%9A%84%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF)

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

参数说明：

- `appDomain`： 应用域名，如： `https://your-app.authing.cn`
- `redirectUri`： 登出回调 URL （非登录，也需要与 Authing 控制台中配置一致）

## 项目示例

参考 `examples/basic` 项目。

### 安装依赖

```bash
npm install --save @authing/nextjs iron-session swr
# or
yarn add @authing/nextjs iron-session swr
```

### 配置环境变量

如 `config/index.ts`，或者其他地方。建议不要忽略该步骤，将用到的变量参数统一管理。

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

### 创建 SessionStorage

创建 `lib/session.ts`。示例中使用的是 `iron-session` 进行创建。

### 创建登录、注销和回调 API

注意：登录 URL 为 `/api/login`， 注销为 `/api/logout`

创建 `pages/api/login.ts`：

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

创建 `pages/api/logout.ts`：

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

创建 `pages/api/callback.ts`：

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

### 在 SSR 中使用

参考 `pages/ssr.tsx`：

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

### 在 SSG 中使用

创建接口： `pages/api/me.ts`：

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

创建钩子 `hooks/use-user.ts`：

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

创建页面 `pages/sg.tsx`：

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

## 其他

- [@authing/remix](https://github.com/Authing/authing-remix)

## LICENSE

MIT
