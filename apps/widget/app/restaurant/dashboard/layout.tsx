'use client'

import React, { useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@workspace/ui/components/resizable"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navItems = [
    { href: '/restaurant/dashboard', label: 'Overview', icon: '📊' },
    { href: '/restaurant/dashboard/orders', label: 'Orders', icon: '🍽️' },
    { href: '/restaurant/dashboard/menu', label: 'Menu', icon: '📋' },
    { href: '/restaurant/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/restaurant/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Sign out using NextAuth
      await signOut({
        redirect: false, // Don't auto-redirect, we'll handle it
      })
      
      // Redirect to home or login page
      router.push('/resturantOwnerLogin')
      
      // Optional: Show success message
      // toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Optional: Show error message
      // toast.error('Failed to logout')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 z-20">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <h1 className="text-xl font-bold">Restaurant Portal</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
                <h3 className="font-bold mb-3">Notifications</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">New order received</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Payment confirmed</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <Link href="/restaurant/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <span className="text-xl">⚙️</span>
          </Link>

          {/* Share Feedback */}
          <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium">
            💬 Feedback
          </button>

          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 pl-4 border-l hover:bg-gray-50 rounded-lg transition p-2"
            >
              <div className="text-right">
                <p className="text-sm font-semibold">Restaurant Owner</p>
                <p className="text-xs text-gray-500">owner@restaurant.com</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                RO
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-2 z-50">
                <Link 
                  href="/restaurant/dashboard/profile" 
                  className="block p-3 hover:bg-gray-100 rounded-lg transition"
                  onClick={() => setShowProfile(false)}
                >
                  👤 My Profile
                </Link>
                <Link 
                  href="/restaurant/dashboard/settings" 
                  className="block p-3 hover:bg-gray-100 rounded-lg transition"
                  onClick={() => setShowProfile(false)}
                >
                  ⚙️ Settings
                </Link>
                <hr className="my-2" />
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left p-3 hover:bg-red-50 text-red-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Logging out...
                    </span>
                  ) : (
                    <span>🚪 Logout</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full w-full"
        >
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30}
          >
            <aside className="h-full bg-slate-50 border-r flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-bold text-xl">Dashboard</h2>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`
                        block p-3 rounded-lg transition
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700 font-semibold' 
                          : 'text-gray-700 hover:bg-slate-200'
                        }
                      `}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t">
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Logging out...
                    </span>
                  ) : (
                    <span>🚪 Logout</span>
                  )}
                </button>
              </div>
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={80}>
            <main className="h-full overflow-auto bg-gray-50">
              <div className="p-6">
                {children}
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}