"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { SearchBox } from "../Search/Search";
import { Session } from "next-auth";
import { UserAvatar } from "../Avatar/UserAvatar";
import { Logo } from "../Logo/logo";
import { ModeToggle } from "../ModeToggle/ModeToggle";

type NavLinks = {
  name: string,
  href: string
}

export function Navbar({ navLinks, session }: { navLinks: NavLinks[], session?: Session }) {
const volume = getAvaliableVolume(session?.user.plan!, session?.user.volume!)
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
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{session.user.plan}</span>
                      <span className="text-xs text-muted-foreground">{volume} Used</span>
                    </div>
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
              )}

              <SearchBox btnClass="hidden" boxClass="relative" />
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
          <SearchBox btnClass="block lg:hidden" boxClass="relative hidden lg:block" />

          {session ? (
            <div className="flex items-center gap-4">
              <UserAvatar session={session} />
              <ModeToggle />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{session.user.plan}</span>
                <span className="text-xs text-muted-foreground">{volume} Used</span>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </nav>
  );
}

function getAvaliableVolume(
  plan: "Free" | "Basic" | "Pro" | "Business" | "Enterprise",
  volumeAvailable: number // in bytes
): string {
  let totalCapacityBytes: number;
  let capacityDisplay: string;
  let divisor: number; // used for converting bytes to the appropriate unit

  switch (plan) {
    case "Free":
      totalCapacityBytes = 1024 * 1024; // 1 KB = 1024 bytes 
      capacityDisplay = "1 MB";
      divisor = 1024 * 1024; // converting to KB
      break;
    case "Basic":
      totalCapacityBytes = 50 * 1024 * 1024; // 50 MB
      capacityDisplay = "50 MB";
      divisor = 1024 * 1024; // converting to MB
      break;
    case "Pro":
      totalCapacityBytes = 250 * 1024 * 1024; // 250 MB
      capacityDisplay = "250 MB";
      divisor = 1024 * 1024; // converting to MB
      break;
    case "Business":
      totalCapacityBytes = 1024 * 1024 * 1024; // 1 GB
      capacityDisplay = "1 GB";
      divisor = 1024 * 1024 * 1024; // converting to GB
      break;
    case "Enterprise":
      totalCapacityBytes = 5 * 1024 * 1024 * 1024; // 5 GB
      capacityDisplay = "5 GB";
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

