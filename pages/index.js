import NavBar from '@/components/ui/navBar';
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <NavBar />
      <div>
        {session ? (
          <h1 className="mt-40 text-center text-5xl font-satoshi-bold uppercase">
            Welcome,
            <br />
            <span className="bg-gradient-to-r from-[#4a4a4a] to-[#b3b3b3] bg-clip-text text-transparent">
              {session.user.username}!
            </span>
          </h1>
        ) : (
          <h2 className="mt-40 text-center text-5xl font-satoshi-bold uppercase">
            Welcome, Guest
          </h2>
        )}
      </div>
    </div>
  );
}
