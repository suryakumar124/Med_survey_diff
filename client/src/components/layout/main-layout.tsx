import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";
import { ReactNode } from "react";
import { Input } from "@/components/ui/input";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export function MainLayout({ 
  children, 
  className,
  pageTitle = "Dashboard",
  pageDescription,
}: MainLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
          <div className="flex items-center flex-1">
            <div className="hidden w-full max-w-lg lg:flex lg:ml-6">
              <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                <Input 
                  className="block w-full h-full py-2 pl-10 pr-3 text-gray-800 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search" 
                  type="search" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 text-gray-500 rounded-md hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="sr-only">View notifications</span>
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none">
          <div className="py-6">
            <div className="px-4 mx-auto sm:px-6 md:px-8">
              {pageTitle && (
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
                  {pageDescription && (
                    <p className="mt-1 text-sm text-gray-600">{pageDescription}</p>
                  )}
                </div>
              )}
              <div className={cn("", className)}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
