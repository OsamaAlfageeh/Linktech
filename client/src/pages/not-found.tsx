import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 mb-6">
            الصفحة المطلوبة غير موجودة أو قد تكون محذوفة.
          </p>
          
          <Link href="/">
            <Button className="w-full">
              <Home className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
