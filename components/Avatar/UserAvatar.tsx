import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import { Session } from "next-auth"
import Link from "next/link";
import { signOut } from "next-auth/react";


export const UserAvatar = ({ session }: { session: Session }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={session.user?.image!} alt="@shadcn" />
          <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem >
          <Link href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL!}>
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href='/pricing'>
            Buy credits
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href='/contact'>
            Support
          </Link>
        </DropdownMenuItem>
        <Logout />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Logout = () => {
  'use client'
  return (
    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/', redirect: true })} className="cursor-pointer">
      Logout
    </DropdownMenuItem>
  )
}
