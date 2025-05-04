import { Request, Response } from "express";
import { db } from "./db";
import { projects, companyProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

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
    // الحصول على مسار الموقع من الطلب
    const baseUrl = process.env.WEBSITE_URL || `${req.protocol}://${req.get('host')}`;
    
    // تاريخ التحديث
    const date = new Date().toISOString();

    // الصفحات الثابتة
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: 'about', priority: '0.8', changefreq: 'monthly' },
      { url: 'contact', priority: '0.8', changefreq: 'monthly' },
      { url: 'how-it-works', priority: '0.8', changefreq: 'monthly' },
      { url: 'for-companies', priority: '0.8', changefreq: 'monthly' },
      { url: 'faq', priority: '0.8', changefreq: 'monthly' },
      { url: 'terms', priority: '0.5', changefreq: 'monthly' },
      { url: 'privacy', priority: '0.5', changefreq: 'monthly' },
      { url: 'blog', priority: '0.9', changefreq: 'daily' },
    ];
    
    // صفحات الخدمات
    const servicePages = [
      { url: 'services', priority: '0.9', changefreq: 'weekly' },
      { url: 'services/software-company-saudi', priority: '0.9', changefreq: 'weekly' },
      { url: 'services/custom-app-development', priority: '0.9', changefreq: 'weekly' },
      { url: 'services/ecommerce-development', priority: '0.9', changefreq: 'weekly' },
      { url: 'services/software-development', priority: '0.9', changefreq: 'weekly' },
    ];
    
    // جلب الشركات الموثقة من قاعدة البيانات
    const companies = await storage.getVerifiedCompanies();
    
    // بداية ملف XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // إضافة الصفحات الثابتة
    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/${page.url}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // إضافة صفحات الخدمات
    servicePages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/${page.url}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // إضافة صفحات الشركات الموثقة
    companies.forEach(company => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/companies/${company.id}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // إضافة صفحات المدونة (في تطبيق حقيقي ستكون هذه البيانات من قاعدة البيانات)
    // إضافة فئات المدونة
    const blogCategories = ['tech-tips', 'tech-trends', 'ecommerce', 'mobile-apps', 'web-development', 'digital-marketing'];
    blogCategories.forEach(category => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/category/${category}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // نهاية ملف XML
    xml += '</urlset>';
    
    // إرسال الرد
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}

/**
 * وظيفة لتوليد ملف robots.txt
 * 
 * تنشئ هذه الوظيفة ملف robots.txt الذي يحدد قواعد الزحف لمحركات البحث
 */
export function generateRobotsTxt(req: Request, res: Response) {
  try {
    const baseUrl = process.env.WEBSITE_URL || `${req.protocol}://${req.get('host')}`;
    
    let robotsTxt = 'User-agent: *\n';
    robotsTxt += 'Allow: /\n';
    robotsTxt += 'Disallow: /api/\n';
    robotsTxt += 'Disallow: /dashboard/\n';
    robotsTxt += 'Disallow: /admin/\n';
    robotsTxt += 'Disallow: /projects/*\n'; // حسب طلب العميل، منع فهرسة صفحات المشاريع لأنها تحتوي على معلومات حساسة
    robotsTxt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
}