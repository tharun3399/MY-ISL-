import React, { createContext, useState, useEffect } from 'react'

export const SidebarContext = createContext()

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [screenSize, setScreenSize] = useState('laptop')

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('phone')
        setSidebarOpen(false)
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet')
        setSidebarOpen(false)
      } else {
        setScreenSize('laptop')
        setSidebarOpen(true) // Sidebar open by default on desktop
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Set initial state
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const openSidebar = () => {
    setSidebarOpen(true)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        isCollapsed,
        toggleCollapse,
        screenSize
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
