import NavBar from '@/components/ui/navBar';

export default function About() {
  return (
    <div className="flex justify-center items-center h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />
      <div className="flex flex-col items-center">
        <h1 className="mt-40 text-[var(--foreground)] text-center text-5xl font-extrabold uppercase">
          About Me
        </h1>
      </div>
    </div>
  );
}
