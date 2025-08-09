import { Link, useLocation } from "wouter";
import { GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function NavigationHeader() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/houses", label: "Houses" },
    { path: "/pbis", label: "PBIS" },
    { path: "/pledge", label: "House Pledge" },
    { path: "/parent-letter", label: "Parent Letter" },
    { path: "/house-sorting", label: "House Sorting" },
    { path: "/teacher/login", label: "Teacher Portal" },
    { path: "/admin", label: "Admin" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50" data-testid="navigation-header">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-4" data-testid="link-home">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-12 w-auto school-logo-3d"
              data-testid="school-logo"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 school-name-3d">House Character Development</h1>
              <p className="text-sm text-gray-600 program-title-3d">Bush Hills STEAM Academy</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
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
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`font-medium p-2 rounded transition-colors ${
                      isActive(item.path)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    data-testid={`mobile-link-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
