"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

import { SearchBox } from "../Search/Search";
import { Session } from "next-auth";
import { UserAvatar } from "../Avatar/UserAvatar";
import { Logo } from "../Logo/logo";

type NavLinks = {
  name: string,
  href: string
}

export function Navbar({ navLinks, session }: { navLinks: NavLinks[], session?: Session }) {
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
                <Logo href={session ? "/dashboard" : "/"} />
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

              <Button
                variant="default"
                size='lg'
                className="bg-gradient-to-r from-pink-600 to-blue-600 text-white hover:from-pink-700 hover:to-blue-700 font-extrabold"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>

              <SearchBox />
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
          <SearchBox />

          {/* Login Button */}
          {session ? <UserAvatar session={session} /> :
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
            </Button>}
        </div>
      </div>
    </nav>);
}
