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


export const UserAvatar = ({ session }: { session: Session }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={session.user?.image ?? ""} alt="@shadcn" />
          <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem >
          <Link href={process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL!}>
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
        <DropdownMenuItem>
          <Link href='/api/auth/signout'>
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
