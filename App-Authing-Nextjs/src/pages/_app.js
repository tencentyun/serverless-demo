import './css/app.css'
import { SWRConfig } from 'swr'

export default function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        fetcher: (resource, init) =>
          fetch(resource, init).then((res) => res.json()),
        onError: (err) => {
          console.error(err);
        }
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  )
}
