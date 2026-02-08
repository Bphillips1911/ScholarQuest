import { Link, useLocation } from "wouter";
import { GraduationCap, Menu, ChevronDown, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

const RESTRICTED_PATHS = ["/houses", "/pbis", "/monthly-pbis"];

export default function NavigationHeader() {
  const [location, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAccessDialog, setShowAccessDialog] = useState(false);

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

  const isAuthorized = userRole === 'admin' || userRole === 'teacher';

  const houses = [
    { id: "franklin", name: "Johnson", icon: "🚀", path: "/houses/franklin" },
    { id: "tesla", name: "Tesla", icon: "⚡", path: "/houses/tesla" },
    { id: "curie", name: "Drew", icon: "🧪", path: "/houses/curie" },
    { id: "nobel", name: "Marshall", icon: "⚖️", path: "/houses/nobel" },
    { id: "lovelace", name: "West", icon: "🧭", path: "/houses/lovelace" }
  ];

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/tutorial", label: "Tutorial" },
    { path: "/houses", label: "Houses", hasDropdown: true, restricted: true },
    { path: "/pbis", label: "PBIS", restricted: true },
    { path: "/monthly-pbis", label: "Monthly Tracking", restricted: true },
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

  const handleRestrictedClick = (e: React.MouseEvent, item: any) => {
    if (item.restricted && !isAuthorized) {
      e.preventDefault();
      e.stopPropagation();
      setShowAccessDialog(true);
    }
  };

  const renderLockBadge = () => (
    <Badge variant="outline" className="ml-1 px-1 py-0 text-[10px] border-red-300 text-red-500 gap-0.5 leading-tight">
      <Lock className="h-2.5 w-2.5" />
    </Badge>
  );

  return (
    <>
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
                <div key={item.path} className="relative">
                  {item.hasDropdown ? (
                    item.restricted && !isAuthorized ? (
                      <Button
                        variant="ghost"
                        className={`font-medium transition-colors text-gray-600 hover:text-blue-600`}
                        onClick={() => setShowAccessDialog(true)}
                        data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
                      >
                        {item.label}
                        {!isAuthorized && renderLockBadge()}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className={`font-medium transition-colors ${
                            isActive(item.path)
                              ? "text-blue-600"
                              : "text-gray-600 hover:text-blue-600"
                          }`}>
                            {item.label}
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white">
                          <DropdownMenuItem asChild>
                            <Link href="/houses" className="w-full">
                              All Houses
                            </Link>
                          </DropdownMenuItem>
                          {houses.map((house) => (
                            <DropdownMenuItem key={house.id} asChild>
                              <Link href={house.path} className="w-full">
                                <span className="mr-2">{house.icon}</span>
                                {house.name}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  ) : item.restricted && !isAuthorized ? (
                    <button
                      onClick={() => setShowAccessDialog(true)}
                      className="font-medium transition-colors text-gray-600 hover:text-blue-600 flex items-center"
                      data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
                    >
                      {item.label}
                      {renderLockBadge()}
                    </button>
                  ) : (
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
                  )}
                  
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
                      {item.hasDropdown ? (
                        <div>
                          {item.restricted && !isAuthorized ? (
                            <button
                              onClick={() => setShowAccessDialog(true)}
                              className="font-medium p-2 rounded transition-colors block w-full text-left text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center"
                              data-testid={`mobile-link-${item.label.toLowerCase().replace(" ", "-")}`}
                            >
                              {item.label}
                              {renderLockBadge()}
                            </button>
                          ) : (
                            <>
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
                              <div className="ml-4 mt-2 space-y-1">
                                {houses.map((house) => (
                                  <Link
                                    key={house.id}
                                    href={house.path}
                                    className="block p-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded"
                                  >
                                    <span className="mr-2">{house.icon}</span>
                                    {house.name}
                                  </Link>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : item.restricted && !isAuthorized ? (
                        <button
                          onClick={() => setShowAccessDialog(true)}
                          className="font-medium p-2 rounded transition-colors block w-full text-left text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center"
                          data-testid={`mobile-link-${item.label.toLowerCase().replace(" ", "-")}`}
                        >
                          {item.label}
                          {renderLockBadge()}
                        </button>
                      ) : (
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
                      )}
                      
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

      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">Access Restricted</DialogTitle>
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
              <p className="text-gray-600 mb-6">
                This section is only accessible to teachers and administrators.
                Please log in with your authorized account to continue.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => { setShowAccessDialog(false); setLocation('/teacher-login'); }}
                  className="w-full"
                  data-testid="button-teacher-login"
                >
                  Teacher Login
                </Button>
                <Button 
                  onClick={() => { setShowAccessDialog(false); setLocation('/admin-login'); }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-admin-login"
                >
                  Administrator Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
