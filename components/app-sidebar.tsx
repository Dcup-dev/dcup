import {
  BookOpen,
  LifeBuoy,
  Home,
  Plug,
  Key,
  Github
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
      title: "Documentation",
      url: "https://dcup.dev/docs",
      icon: BookOpen,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/contact",
      icon: LifeBuoy,
    },
    {
      title: "Github",
      url: "https://github.com/dcup-dev/dcup",
      icon: Github
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
