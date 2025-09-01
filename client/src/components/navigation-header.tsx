import { Link, useLocation } from "wouter";
import { GraduationCap, Menu, ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function NavigationHeader() {
  const [location] = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check for authentication tokens to determine user role
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const teacherToken = localStorage.getItem('teacherToken');
    
    if (adminToken) {
      setUserRole('admin');
    } else if (teacherToken) {
      setUserRole('teacher');
    } else {
      setUserRole(null);
    }
  }, [location]);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/tutorial", label: "Tutorial" },
    { path: "/houses", label: "Houses" },
    { path: "/pbis", label: "PBIS" },
    { path: "/monthly-pbis", label: "Monthly Tracking" },
    { path: "/pledge", label: "House Pledge" },
    { path: "/parent-letter", label: "Parent Letter" },
    { path: "/house-sorting", label: "House Sorting" },
    { path: "/teacher-login", label: "Teacher Portal" },
    { path: "/admin-login", label: "Admin Login" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50" data-testid="navigation-header">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-12 w-auto"
              data-testid="school-logo"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item, index) => (
              <div key={item.path}>
                <Link
                  href={item.path}
                  className={`font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                  data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Link>
                
                {/* Add dropdown after Dashboard tab if user has role */}
                {item.path === "/" && userRole && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-gray-600 hover:text-blue-600 font-medium ml-2">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white">
                      <DropdownMenuItem onClick={() => window.location.href = userRole === 'admin' ? '/admin' : '/teacher-dashboard'}>
                        <Home className="h-4 w-4 mr-2" />
                        Return to {userRole === 'admin' ? 'Admin' : 'Teacher'} Dashboard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <div key={item.path}>
                    <Link
                      href={item.path}
                      className={`font-medium p-2 rounded transition-colors block ${
                        isActive(item.path)
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      data-testid={`mobile-link-${item.label.toLowerCase().replace(" ", "-")}`}
                    >
                      {item.label}
                    </Link>
                    
                    {/* Add mobile return option after Dashboard */}
                    {item.path === "/" && userRole && (
                      <Link
                        href={userRole === 'admin' ? '/admin' : '/teacher-dashboard'}
                        className="font-medium p-2 rounded transition-colors block text-gray-500 hover:text-blue-600 hover:bg-gray-50 ml-4 text-sm"
                        data-testid={`mobile-link-return-${userRole}-dashboard`}
                      >
                        <Home className="h-4 w-4 mr-2 inline" />
                        Return to {userRole === 'admin' ? 'Admin' : 'Teacher'} Dashboard
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
