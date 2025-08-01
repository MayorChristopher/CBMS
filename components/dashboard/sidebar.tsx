"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Users,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Database,
  Shield,
  Code,
  Target,
  Globe,
} from "lucide-react"
import { signOut } from "@/lib/auth"
import { getCurrentUserProfile, Profile } from "@/lib/profiles"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Sessions", href: "/dashboard/sessions", icon: Activity },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Integration", href: "/dashboard/integration", icon: Code },
  { name: "Admin", href: "/dashboard/admin", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const analystNavigation = [
  { name: "Analyst Dashboard", href: "/dashboard/analyst", icon: BarChart3 },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Integration", href: "/dashboard/integration", icon: Code },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const customerNavigation = [
  { name: "Dashboard", href: "/dashboard/customer", icon: BarChart3 },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Integration", href: "/dashboard/integration", icon: Code },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Check if we're on mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar for mobile
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/login"
  }

  // Get navigation based on user role
  const getNavigation = () => {
    if (!profile) return adminNavigation
    switch (profile.role) {
      case 'admin':
        return adminNavigation
      case 'analyst':
        return analystNavigation
      case 'user':
        return customerNavigation
      default:
        return adminNavigation
    }
  }

  const navigation = getNavigation()

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile toggle button (shown only on mobile) */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      
      <div
        className={cn(
          "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
          // Mobile: fixed positioning with z-index
          "md:h-full md:static fixed z-40 top-0 bottom-0 left-0",
          // Control width and visibility
          collapsed ? "w-16" : "w-64",
          // Mobile visibility
          mobileOpen ? "translate-x-0" : "md:translate-x-0 -translate-x-full"
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CBMS</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed ? "px-2" : "px-3",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
    </>
  )
}