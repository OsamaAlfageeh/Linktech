import { Request, Response } from "express";
import { storage } from "./storage";
import { Project, CompanyProfile } from "@shared/schema";

/**
 * وظيفة لتوليد خريطة موقع XML ديناميكية
 * 
 * تنشئ هذه الوظيفة ملف XML يحتوي على روابط صفحات الموقع الأساسية،
 * بالإضافة إلى روابط ديناميكية للمشاريع والشركات الموثقة
 * 
 * ملاحظة: تم استبعاد صفحات المشاريع الفردية بناءً على طلب العميل 
 * لأنها تحتوي على معلومات حساسة
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    // الحصول على المشاريع والشركات من قاعدة البيانات
    const companies = await storage.getCompanyProfiles();
    
    // تحديد عنوان الموقع الرئيسي
    const baseUrl = 'https://linktech.app';
    
    // التاريخ الحالي
    const currentDate = new Date().toISOString().split('T')[0];
    
    // تحديد الصفحات الثابتة
    const staticPages = [
      { url: '', lastmod: currentDate, priority: "1.0", changefreq: "daily" },
      { url: 'projects', lastmod: currentDate, priority: "0.9", changefreq: "daily" },
      { url: 'how-it-works', lastmod: currentDate, priority: "0.8", changefreq: "weekly" },
      { url: 'about', lastmod: currentDate, priority: "0.7", changefreq: "monthly" },
      { url: 'contact', lastmod: currentDate, priority: "0.7", changefreq: "monthly" },
      { url: 'terms', lastmod: currentDate, priority: "0.5", changefreq: "monthly" },
      { url: 'privacy', lastmod: currentDate, priority: "0.5", changefreq: "monthly" },
      { url: 'sitemap', lastmod: currentDate, priority: "0.4", changefreq: "monthly" },
      // صفحات إضافية
      { url: 'for-companies', lastmod: currentDate, priority: "0.8", changefreq: "weekly" },
    ];
    
    // بداية ملف XML مع تعريف الفضاءات الاسمية
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
    xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
    
    // إضافة الصفحات الثابتة
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${page.url}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      
      // إضافة الروابط متعددة اللغات (للاستخدام المستقبلي)
      xml += '    <xhtml:link rel="alternate" hreflang="ar" href="' + baseUrl + '/' + page.url + '" />\n';
      
      // إضافة الصور المرتبطة (للصفحات التي تحتوي على صور مهمة مثل الصفحة الرئيسية)
      if (page.url === '') {
        xml += '    <image:image>\n';
        xml += '      <image:loc>' + baseUrl + '/images/logo.png</image:loc>\n';
        xml += '      <image:title>لينكتك - منصة ربط رواد الأعمال بشركات البرمجة</image:title>\n';
        xml += '    </image:image>\n';
      }
      
      xml += '  </url>\n';
    });
    
    // إضافة صفحات الشركات الموثقة (فقط الموثقة تظهر في نتائج البحث)
    companies
      .filter((company: CompanyProfile) => company.verified)
      .forEach((company: CompanyProfile) => {
        // استخدام التاريخ الحالي
        const lastmod = currentDate;
          
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/companies/${company.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        
        // إضافة صورة الشركة إذا كانت متوفرة
        if (company.logo) {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${company.logo}</image:loc>\n`;
          xml += `      <image:title>شركة تقنية</image:title>\n`;
          xml += `      <image:caption>شعار شركة تقنية معتمدة</image:caption>\n`;
          xml += '    </image:image>\n';
        }
        
        xml += '  </url>\n';
      });
    
    // إغلاق ملف XML
    xml += '</urlset>';
    
    // إرسال الاستجابة كـ XML
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // تخزين مؤقت لمدة يوم واحد
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}