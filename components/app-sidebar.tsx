import {
  BookOpen,
  LifeBuoy,
  Home,
  Plug,
  Key,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "./Logo/logo"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { FaGithub, FaSearch } from "react-icons/fa"
import { RiBillLine } from "react-icons/ri"
import { env } from "process"

const isCloud = env.DCUP_ENV === 'CLOUD';
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,

    },
    {
      title: "Connections",
      url: "/connections",
      icon: Plug,

    },
    {
      title: "API Keys",
      url: "/integration",
      icon: Key,
    },
    {
      title: "Query",
      url: "/query",
      icon: FaSearch
    },
    {
      title: "Documentation",
      url: "https://dcup.dev/docs",
      icon: BookOpen,
    },
  ],
  navSecondary: [
    ...(isCloud
      ? [{
        title: "Customer Portal",
        url: env.PADDLE_CUSTOMER_PORTAL_URL!,
        icon: RiBillLine
      }]
      : []),
    {
      title: "Support",
      url: "/contact",
      icon: LifeBuoy,
    },
    {
      title: "Github",
      url: "https://github.com/dcup-dev/dcup",
      icon: FaGithub
    }
  ],
}

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Logo href="/dashbord" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: session?.user.name || "user",
          email: session?.user.email || "ali@dcup.dev",
          avatar: session?.user.image || "",
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
