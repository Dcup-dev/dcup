import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Session } from "next-auth";
import { UserAvatar } from "../Avatar/UserAvatar";
import { Logo } from "../Logo/logo";
import { ModeToggle } from "../ModeToggle/ModeToggle";
import { vSizes } from "@/lib/constants";
import { FaGithub } from "react-icons/fa";


export function Navbar({ session }: { session?: Session }) {
  const navLinks = getNavLinks(!!session)

  const volume = getAvaliableVolume(session?.user.plan, session?.user.volume)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center">
          <Logo href={session ? "/dashboard" : "/"} />
        </div>
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {session ? (
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <UserAvatar session={session} />
                      <ModeToggle />
                    </div>
                    <Link href={"/pricing"}>
                      <div className="flex flex-col items-center cursor-pointer">
                        <span className="text-sm font-medium">{session.user.plan!}</span>
                        <span className="text-xs text-muted-foreground">{volume || "0/0"} Used</span>
                      </div>
                    </Link>
                  </div>
                ) : (
                  <Logo href="/" />
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-8 pt-10">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {!session && (
                <div className="flex items-center gap-2">

                  <Button
                    variant="default"
                    size='lg'
                    className="bg-gradient-to-r from-pink-600 to-blue-600 text-white hover:from-pink-700 hover:to-blue-700 font-extrabold"
                    asChild
                  >
                    <Link href={"/login"}>
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size='icon' asChild variant={'outline'}>
                    <Link href="https://github.com/dcup-dev" target="_blank">
                      <FaGithub />
                    </Link>
                  </Button>
                </div>

              )}

            </div>
          </SheetContent>
        </Sheet>

        {/* Navigation Links */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">

          {session ? (
            <div className="flex items-center gap-4">
              <UserAvatar session={session} />
              <ModeToggle />
              <Link href={"/pricing"}>
                <div className="flex flex-col items-start cursor-pointer">
                  <span className="text-sm font-medium">{session.user.plan!}</span>
                  <span className="text-xs text-muted-foreground">{volume || "0/0"} Used</span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size='lg'
                className="bg-gradient-to-r from-pink-600 to-blue-600 text-white hover:from-pink-700 hover:to-blue-700 font-extrabold"
                asChild
              >
                <Link href={"/login"}>
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
                <Link href="https://github.com/dcup-dev" target="_blank">
                  <FaGithub className="h-8 w-8" />
                </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

type NavLinks = {
  name: string,
  href: string
}
function getNavLinks(isLogin: boolean): NavLinks[] {
  if (!isLogin) return [
    { name: "Pricing", href: "/pricing" },
    { name: "Docs", href: "/docs" },
    { name: "Contact", href: "/contact" },
  ];
  return [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Integration", href: "/integration" },
    { name: "Docs", href: "/docs" },
  ];

}

function getAvaliableVolume(
  plan?: "Free" | "Basic" | "Pro" | "Business" | "Enterprise",
  volumeAvailable?: number // in bytes
): string | null {
  if (!plan || !volumeAvailable) return null
  let totalCapacityBytes: number;
  let capacityDisplay: string;
  let divisor: number; // used for converting bytes to the appropriate unit

  switch (plan) {
    case "Free":
      totalCapacityBytes = vSizes.MB_1;
      capacityDisplay = "1 MB";
      divisor = 1024 * 1024; // converting to MB
      break;
    case "Basic":
      totalCapacityBytes = vSizes.MB_50; // 50 MB
      capacityDisplay = "50 MB";
      divisor = 1024 * 1024; // converting to MB
      break;
    case "Pro":
      totalCapacityBytes = vSizes.MB_250; // 250 MB
      capacityDisplay = "250 MB";
      divisor = 1024 * 1024; // converting to MB
      break;
    case "Business":
      totalCapacityBytes = vSizes.GB_5; // 5 GB
      capacityDisplay = "5 GB";
      divisor = 1024 * 1024 * 1024; // converting to GB
      break;
    case "Enterprise":
      totalCapacityBytes = vSizes.GB_15; // 5 GB
      capacityDisplay = "15 GB";
      divisor = 1024 * 1024 * 1024; // converting to GB
      break;
    default:
      // default values (should not happen if plan is properly typed)
      totalCapacityBytes = 0;
      capacityDisplay = "";
      divisor = 1;
  }

  // Calculate the used volume in bytes.
  const usedBytes = totalCapacityBytes - volumeAvailable;

  // Convert the used bytes to the corresponding unit.
  const usedInUnit = usedBytes / divisor;

  // Format the used volume: if it’s not an integer, show one digit after the decimal point.
  const formattedUsed =
    Number.isInteger(usedInUnit) ? usedInUnit.toString() : usedInUnit.toFixed(1);

  return `${formattedUsed} / ${capacityDisplay}`;
}

