import "@/styles/globals.css";
import NavBar from "@/components/ui/navBar";
import Head from "next/head";
import { SessionProvider} from "next-auth/react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '900'],
});

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <main className={`${poppins.className} mx-24 flex flex-col justify-center items-center`}>
        <Head>
          <title>Test</title> 
        </Head>
        <NavBar /> {/* Global Navigation Bar */}
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}