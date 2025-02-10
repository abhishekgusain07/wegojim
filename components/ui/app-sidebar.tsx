"use client"

import Link from "next/link"
import { BarChart, Calendar, Dumbbell, Home, HomeIcon, Inbox, MessageSquare, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/Home",
    icon: HomeIcon,
  },
  {
    title: "Log",
    url: "/log",
    icon: Dumbbell,
  },
  {
    title: "Review Progress",
    url: "/reviewProgress",
    icon: BarChart,
  },
  {
    title: "Chat With Ai",
    url: "/chatWithAi",
    icon: MessageSquare,
  }
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
