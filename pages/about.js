import NavBar from '@/components/ui/navBar';

export default function About() {
  return (
    <div className="flex justify-center items-center h-screen">
      <NavBar />
      <div className="flex flex-col items-center">
        <h1 className="mt-40 text-center text-5xl font-satoshi-bold uppercase">
          About Me
        </h1>
      </div>
    </div>
  );
}
