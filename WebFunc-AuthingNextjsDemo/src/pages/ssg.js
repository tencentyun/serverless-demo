import useUser from '../hooks/use-user'
import Link from 'next/link'

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