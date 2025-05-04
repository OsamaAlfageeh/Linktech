import { Request, Response } from "express";
import { storage } from "./storage";
import { Project, CompanyProfile } from "@shared/schema";

/**
 * وظيفة لتوليد خريطة موقع XML ديناميكية
 * 
 * تنشئ هذه الوظيفة ملف XML يحتوي على روابط صفحات الموقع الأساسية،
 * بالإضافة إلى روابط ديناميكية للمشاريع والشركات
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    // الحصول على المشاريع والشركات من قاعدة البيانات
    const projects = await storage.getProjects();
    const companies = await storage.getCompanyProfiles();
    
    // تحديد عنوان الموقع الرئيسي
    const baseUrl = 'https://linktech.app';
    
    // تحديد الصفحات الثابتة
    const staticPages = [
      { url: '', lastmod: new Date().toISOString().split('T')[0], priority: "1.0", changefreq: "daily" },
      { url: 'projects', lastmod: new Date().toISOString().split('T')[0], priority: "0.9", changefreq: "daily" },
      { url: 'how-it-works', lastmod: new Date().toISOString().split('T')[0], priority: "0.8", changefreq: "weekly" },
      { url: 'about', lastmod: new Date().toISOString().split('T')[0], priority: "0.7", changefreq: "monthly" },
      { url: 'contact', lastmod: new Date().toISOString().split('T')[0], priority: "0.7", changefreq: "monthly" },
      { url: 'terms', lastmod: new Date().toISOString().split('T')[0], priority: "0.5", changefreq: "monthly" },
      { url: 'privacy', lastmod: new Date().toISOString().split('T')[0], priority: "0.5", changefreq: "monthly" },
    ];
    
    // بداية ملف XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // إضافة الصفحات الثابتة
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${page.url}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    // إضافة صفحات المشاريع
    // فقط المشاريع المفتوحة يتم تضمينها في خريطة الموقع
    projects
      .filter((project: Project) => project.status === 'open')
      .forEach((project: Project) => {
        // نستخدم التاريخ الحالي في حالة عدم وجود تاريخ الإنشاء
        const lastmod = new Date().toISOString().split('T')[0];
          
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/projects/${project.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });
    
    // إضافة صفحات الشركات الموثقة (فقط الموثقة تظهر في نتائج البحث)
    companies
      .filter((company: CompanyProfile) => company.verified)
      .forEach((company: CompanyProfile) => {
        // بما أننا لا نملك حقل createdAt في نموذج الشركة، نستخدم التاريخ الحالي
        const lastmod = new Date().toISOString().split('T')[0];
          
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/companies/${company.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
    
    // إغلاق ملف XML
    xml += '</urlset>';
    
    // إرسال الاستجابة كـ XML
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}