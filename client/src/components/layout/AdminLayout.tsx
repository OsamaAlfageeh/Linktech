import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { User, ChevronLeft, Home, MessageSquare, Users, FileText, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location] = useLocation();

  const menuItems = [
    { label: "لوحة التحكم", href: "/dashboard/admin", icon: Home },
    { label: "المستخدمين", href: "/dashboard/admin/users", icon: Users },
    { label: "المشاريع", href: "/dashboard/admin/projects", icon: FileText },
    { label: "رسائل الاتصال", href: "/admin/contact-messages", icon: MessageSquare },
    { label: "المدونة", href: "/admin/blog-management", icon: FileText },
    { label: "عملاء التميز", href: "/admin/premium-clients", icon: Star },
    { label: "عملاء نفخر بهم", href: "/admin/featured-clients-management", icon: Award },
  ];

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-primary">لوحة التحكم</h2>
              <Link href="/">
                <Button variant="ghost" size="icon" title="العودة إلى الموقع">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.href;
                const ItemIcon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start ${isActive ? "" : "hover:bg-muted"}`}
                    >
                      <ItemIcon className="ml-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;