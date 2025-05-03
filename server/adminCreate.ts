// سكريبت لإضافة مستخدم المسؤول
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    // نتحقق أولاً مما إذا كان هناك مستخدم مسؤول بالفعل
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin) {
      // إذا كان المستخدم موجوداً بالفعل، نقوم بتحديث كلمة المرور فقط
      console.log("المستخدم المسؤول موجود، جاري تحديث كلمة المرور...");
      
      // تشفير كلمة المرور
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, existingAdmin.id));
      
      console.log("تم تحديث كلمة مرور المستخدم المسؤول بنجاح");
    } else {
      // إنشاء مستخدم مسؤول جديد
      console.log("جاري إنشاء مستخدم مسؤول جديد...");
      
      // تشفير كلمة المرور
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      const [admin] = await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@techlink.example",
        role: "admin",
        name: "مسؤول النظام",
        avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      }).returning();
      
      console.log("تم إنشاء المستخدم المسؤول بنجاح:", admin);
    }
  } catch (error) {
    console.error("حدث خطأ أثناء إنشاء/تحديث المستخدم المسؤول:", error);
  }
}

// تنفيذ الدالة
createAdminUser();