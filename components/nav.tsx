import Link from "next/link";
import DarkModeToggle from "./dark-mode-toggle";

async function Nav() {
  return (
    <header className="fixed top-0 bg-background shadow-md w-full z-50 p-2 border-b h-14">
      <nav className="flex justify-between items-center sm:container">
        <Link href="/">
          <h3 className="md:text-xl font-semibold">Soham Bhikadiya</h3>
        </Link>

        <DarkModeToggle />
      </nav>
    </header>
  );
}

export default Nav;
