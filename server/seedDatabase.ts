import { db } from "./db";
import { users, companyProfiles, projects, testimonials } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("Seeding database with initial data...");

  try {
    // Test database connection first by attempting to query existing tables
    console.log("Testing database connection...");
    // Simple connection test by querying the information schema
    await db.query.users.findMany({ limit: 0 });
    console.log("Database connection successful");

    // First check if we have any data in essential tables to avoid duplicating data
    const existingUsers = await db.query.users.findMany({ limit: 1 });
    const existingCompanies = await db.query.companyProfiles.findMany({ limit: 1 });
    const existingProjects = await db.query.projects.findMany({ limit: 1 });
    
    // Skip user creation if users already exist
    let skipUsers = existingUsers.length > 0;
    let skipCompanies = existingCompanies.length > 0;
    let skipProjects = existingProjects.length > 0;
    
    if (skipUsers && skipCompanies && skipProjects) {
      console.log("All database tables already have data, skipping seed");
      return;
    }

    // Get or create sample users
    let user1, user2, user3, user4, user5;
    
    if (skipUsers) {
      console.log("Users already exist, retrieving existing user data");
      // Get existing users
      [user1] = await db.select().from(users).where(eq(users.username, "ahmed_entrepreneur")).limit(1);
      [user2] = await db.select().from(users).where(eq(users.username, "tech_solutions")).limit(1);
      [user3] = await db.select().from(users).where(eq(users.username, "digital_hub")).limit(1);
      [user4] = await db.select().from(users).where(eq(users.username, "smart_code")).limit(1);
      [user5] = await db.select().from(users).where(eq(users.username, "sara_entrepreneur")).limit(1);
    } else {
      console.log("Creating new users...");
      // Create new users
      [user1] = await db.insert(users).values({
        username: "ahmed_entrepreneur",
        password: "password123",
        email: "ahmed@example.com",
        role: "entrepreneur",
        name: "أحمد السيد",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      }).returning();
      
      [user2] = await db.insert(users).values({
        username: "tech_solutions",
        password: "password123",
        email: "tech@example.com",
        role: "company",
        name: "تك سوليوشنز",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      }).returning();
      
      [user3] = await db.insert(users).values({
        username: "digital_hub",
        password: "password123",
        email: "digital@example.com",
        role: "company",
        name: "ديجيتال هب",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      }).returning();
      
      [user4] = await db.insert(users).values({
        username: "smart_code",
        password: "password123",
        email: "smart@example.com",
        role: "company",
        name: "سمارت كود",
        avatar: "https://randomuser.me/api/portraits/men/4.jpg",
      }).returning();
      
      [user5] = await db.insert(users).values({
        username: "sara_entrepreneur",
        password: "password123",
        email: "sara@example.com",
        role: "entrepreneur",
        name: "سارة العمري",
        avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      }).returning();
    }
    
    // Create company profiles
    if (!skipCompanies) {
      console.log("Creating company profiles...");
      await db.insert(companyProfiles).values({
        userId: user2.id,
        description: "متخصصون في تطوير تطبيقات الجوال والويب للشركات والمؤسسات، مع خبرة تزيد عن 8 سنوات في مجال البرمجة.",
        logo: "https://randomuser.me/api/portraits/men/2.jpg",
        coverPhoto: "https://images.unsplash.com/photo-1560179707-f14e90ef3623",
        website: "https://techsolutions.example.com",
        location: "الرياض، المملكة العربية السعودية",
        skills: ["تطبيقات الويب", "تطبيقات الجوال", "الذكاء الاصطناعي"],
        rating: 5,
        reviewCount: 48
      });
      
      await db.insert(companyProfiles).values({
        userId: user3.id,
        description: "شركة رائدة في مجال التحول الرقمي وتطوير الحلول المتكاملة للشركات الناشئة والمؤسسات الكبيرة.",
        logo: "https://randomuser.me/api/portraits/women/3.jpg",
        coverPhoto: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
        website: "https://digitalhub.example.com",
        location: "جدة، المملكة العربية السعودية",
        skills: ["التحول الرقمي", "تجارة إلكترونية", "برمجة خلفية"],
        rating: 5,
        reviewCount: 62
      });
      
      await db.insert(companyProfiles).values({
        userId: user4.id,
        description: "متخصصون في تطوير واجهات المستخدم وتجربة المستخدم، مع تركيز على تصميم تطبيقات سهلة الاستخدام.",
        logo: "https://randomuser.me/api/portraits/men/4.jpg",
        coverPhoto: "https://images.unsplash.com/photo-1556761175-4b46a572b786",
        website: "https://smartcode.example.com",
        location: "الدمام، المملكة العربية السعودية",
        skills: ["تصميم UI/UX", "تطوير واجهات", "مواقع تفاعلية"],
        rating: 4,
        reviewCount: 27
      });
    } else {
      console.log("Company profiles already exist, skipping creation");
    }
    
    // Create projects
    const today = new Date();
    
    if (!skipProjects) {
      console.log("Creating projects...");
      await db.insert(projects).values({
        title: "تطبيق توصيل طلبات للمطاعم",
        description: "نبحث عن شركة برمجة متخصصة لتطوير تطبيق جوّال لتوصيل الطعام من المطاعم المحلية، مع لوحة تحكم للمطاعم ونظام تتبع للسائقين.",
        budget: "50,000 - 80,000 ريال",
        duration: "3-6 أشهر",
        skills: ["تطبيق جوال", "iOS", "Android", "لوحة تحكم"],
        userId: user1.id,
        status: "open",
        highlightStatus: "عالي الطلب",
        createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      });
      
      await db.insert(projects).values({
        title: "منصة تعليمية تفاعلية",
        description: "تطوير منصة تعليمية على الويب تدعم الدورات التفاعلية، والاختبارات، ومنتدى للطلاب. يجب أن تكون متوافقة مع الأجهزة المختلفة.",
        budget: "70,000 - 120,000 ريال",
        duration: "4-8 أشهر",
        skills: ["تطوير ويب", "تصميم UI/UX", "React", "Node.js"],
        userId: user5.id,
        status: "open",
        highlightStatus: "جديد",
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      });
      
      await db.insert(projects).values({
        title: "نظام إدارة عقارات",
        description: "نظام متكامل لإدارة العقارات يشمل إدارة الممتلكات، والإيجارات، والصيانة، والفواتير، مع تطبيق جوال للمستأجرين والملاك.",
        budget: "100,000 - 150,000 ريال",
        duration: "6-10 أشهر",
        skills: ["نظام إدارة", "تطبيق ويب", "تطبيق جوال", "API"],
        userId: user1.id,
        status: "open",
        highlightStatus: null,
        createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      });
    } else {
      console.log("Projects already exist, skipping creation");
    }
    
    // Check for testimonials
    const existingTestimonials = await db.query.testimonials.findMany({ limit: 1 });
    let skipTestimonials = existingTestimonials.length > 0;
    
    // Create testimonials
    if (!skipTestimonials) {
      console.log("Creating testimonials...");
      await db.insert(testimonials).values({
        userId: user1.id,
        content: "وجدت الشريك المثالي لتنفيذ مشروعي من خلال المنصة. تواصلت مع عدة شركات مميزة واخترت الأنسب. التطبيق الآن يعمل بكفاءة عالية ولدينا أكثر من 10,000 مستخدم نشط.",
        role: "entrepreneur",
        companyName: null,
        userTitle: "مؤسس تطبيق \"طلباتي\"",
        rating: 5,
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      });
      
      await db.insert(testimonials).values({
        userId: user5.id,
        content: "المنصة ساعدتنا في الوصول لعملاء جدد وتنفيذ مشاريع متنوعة. نظام التواصل سهل وفعال، والدعم الفني ممتاز. حققنا نمواً بنسبة 40% في عدد المشاريع منذ انضمامنا للمنصة.",
        role: "company",
        companyName: "شركة ديجيتال هب",
        userTitle: "مديرة تطوير الأعمال",
        rating: 5,
        avatar: "https://randomuser.me/api/portraits/women/5.jpg",
        createdAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      });
    } else {
      console.log("Testimonials already exist, skipping creation");
    }
    
    console.log("Database successfully seeded with initial data");
  } catch (error) {
    console.error("Error seeding database:", error);
    
    // Log more detailed database error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Re-throw in development for debugging, but not in production
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
    
    console.warn("Seeding failed but continuing in production mode");
  }
}

export { seedDatabase };