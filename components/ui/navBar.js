import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import routes from '@/routes';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 w-full p-4 z-50 bg-transparent font-satoshi-bold">
      <div className="flex justify-center"> {/* This centers the navbar */}
        <ul className="flex list-none gap-6">
          <li><Link href={routes.home}><Button variant="ghost">Home</Button></Link></li>
          <li><Link href={routes.about}><Button variant="ghost">About</Button></Link></li>
          <li><Link href={routes.contact}><Button variant="ghost">Contact</Button></Link></li>
          {session ? (
            <>
              <li><Link href={routes.timesheet}><Button variant="ghost">Timesheet</Button></Link></li>
              <li><Link href={routes.inquiries}><Button variant="ghost">Inquiries</Button></Link></li>
              <li><Link href={routes.employee}><Button variant="ghost">Employee</Button></Link></li>
              <li><Button variant="ghost" onClick={() => signOut({ callbackUrl: routes.home })}>Logout</Button></li>
            </>
          ) : (
            <li><Link href={routes.login}><Button variant="ghost">Login</Button></Link></li>
          )}
        </ul>
      </div>
    </nav>
  );
}
