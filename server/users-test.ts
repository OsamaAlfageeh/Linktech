import { storage } from './storage';

// سكريبت اختبار للتحقق من أدوار المستخدمين في قاعدة البيانات
async function checkUsersRoles() {
  try {
    console.log('جاري التحقق من أدوار المستخدمين في قاعدة البيانات...');
    
    // الحصول على جميع المستخدمين
    const users = await storage.getUsers();
    console.log(`تم العثور على ${users.length} مستخدم في قاعدة البيانات`);
    
    // عرض معلومات المستخدمين
    for (const user of users) {
      console.log(`المستخدم #${user.id}: ${user.username} - الدور: ${user.role} - الاسم: ${user.name}`);
    }
    
    // التحقق من المستخدمين بدور "entrepreneur"
    const entrepreneurs = users.filter(user => user.role === 'entrepreneur');
    console.log(`عدد رواد الأعمال: ${entrepreneurs.length}`);
    
    // التحقق من المستخدمين بدور "company"
    const companies = users.filter(user => user.role === 'company');
    console.log(`عدد الشركات: ${companies.length}`);
    
    // التحقق من المستخدمين بدور "admin"
    const admins = users.filter(user => user.role === 'admin');
    console.log(`عدد المسؤولين: ${admins.length}`);
    
    // التحقق من المشاريع
    const projects = await storage.getProjects();
    console.log(`عدد المشاريع الإجمالي: ${projects.length}`);
    
    // رؤية من أنشأ كل مشروع
    for (const project of projects) {
      const projectUser = await storage.getUser(project.userId);
      console.log(`المشروع #${project.id}: "${project.title}" - أنشأه المستخدم: ${projectUser?.username} (${projectUser?.role})`);
    }
    
    // فحص المشاريع المنشأة من قبل رواد الأعمال
    let entrepreneurProjects = 0;
    for (const project of projects) {
      const projectUser = await storage.getUser(project.userId);
      if (projectUser?.role === 'entrepreneur') {
        entrepreneurProjects++;
      }
    }
    console.log(`عدد المشاريع المنشأة من رواد الأعمال: ${entrepreneurProjects}`);
    
  } catch (error) {
    console.error('حدث خطأ أثناء فحص المستخدمين:', error);
  }
}

// تنفيذ الاختبار
checkUsersRoles();