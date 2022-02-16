import Link from 'next/link'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from '../config'

export default function SsrProfile({
  user
}) {
  return (
    <>
      <nav>
        <Link href='/ssg'>SSG</Link> | <Link href='/api/logout'>Logout</Link>
      </nav>
      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>
    </>
  );
}
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