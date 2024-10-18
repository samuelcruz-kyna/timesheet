import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; 
import routes from '@/routes';
import { useState, useEffect } from "react";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false); // Scroll state to control appearance
  const { data: session, status } = useSession(); // Get session data

  // Function to handle scroll detection
  const handleScroll = () => {
    if (window.scrollY > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full p-4 text-white flex justify-center z-50 transition-colors duration-300 ${
        scrolled ? 'bg-gray-800' : 'bg-transparent'
      } font-helvetica`}
    >
      <ul className="flex list-none m-0 p-0 gap-6">
        <li>
          <Link
            href={routes.home}
            className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            href={routes.about}
            className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
          >
            About
          </Link>
        </li>
        <li>
          <Link
            href={routes.contact}
            className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
          >
            Contact
          </Link>
        </li>
        {session ? (
          <>
            <li>
              <Link
                href={routes.timesheet}
                className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
              >
                Timesheet
              </Link>
            </li>
            <li>
              <Link
                href={routes.inquiries}
                className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
              >
                Inquiries
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut({ callbackUrl: routes.home })}
                className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link
              href={routes.login}
              className="text-white hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] bg-clip-text hover:text-transparent transition-all duration-300"
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
