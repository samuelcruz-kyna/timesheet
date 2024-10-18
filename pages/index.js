import NavBar from '@/components/ui/navBar';
import { useSession } from "next-auth/react";  

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    // While checking session, display loading
    return <div className="flex justify-center items-center h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />
      <div>
        {session ? (
          <h1 className="mt-40 text-[var(--foreground)] text-center text-5xl font-extrabold uppercase">
            Welcome,
            <br />
            <span className="bg-gradient-to-r from-[#4a4a4a] to-[#b3b3b3] bg-clip-text text-transparent">
              {session.user.username}!
            </span>
          </h1>
        ) : (
          <h2 className="mt-40 text-[var(--foreground)] text-center text-5xl font-extrabold uppercase">
            Welcome,
            <br />
            <span className="hover:text-[var(--hover-grey)] transition-colors duration-300">
              Guest
            </span>
          </h2>
        )}
      </div>
    </div>
  );
}
