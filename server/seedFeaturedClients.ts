import { db } from "./db";
import { featuredClients } from "@shared/schema";

export async function seedFeaturedClients() {
  console.log("Seeding featured clients...");
  
  // Check if we already have featured clients
  const existingClients = await db.select().from(featuredClients).limit(1);
  if (existingClients.length > 0) {
    console.log("Featured clients already exist, skipping seed.");
    return;
  }

  const sampleClients = [
    {
      name: "أرامكو السعودية",
      logo: "https://logos-world.net/wp-content/uploads/2020/12/Aramco-Logo.png",
      website: "https://www.aramco.com",
      description: "أكبر شركة للنفط في العالم",
      category: "النفط والغاز",
      order: 1,
      active: true
    },
    {
      name: "البنك الأهلي السعودي",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/National_Commercial_Bank_%28logo%29.svg/1200px-National_Commercial_Bank_%28logo%29.svg.png",
      website: "https://www.alahli.com",
      description: "أحد أكبر البنوك في المملكة العربية السعودية",
      category: "البنوك والمصارف",
      order: 2,
      active: true
    },
    {
      name: "السعودية للكهرباء",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Saudi_Electricity_Company_logo.svg/1200px-Saudi_Electricity_Company_logo.svg.png",
      website: "https://www.se.com.sa",
      description: "الشركة الرائدة في مجال الكهرباء في المملكة",
      category: "الكهرباء والطاقة",
      order: 3,
      active: true
    },
    {
      name: "الاتصالات السعودية",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/STC_logo.svg/1200px-STC_logo.svg.png",
      website: "https://www.stc.com.sa",
      description: "الشركة الرائدة في مجال الاتصالات في المملكة",
      category: "الاتصالات والتقنية",
      order: 4,
      active: true
    },
    {
      name: "مجموعة صافولا",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Savola_Group_logo.svg/1200px-Savola_Group_logo.svg.png",
      website: "https://www.savola.com",
      description: "مجموعة رائدة في مجال الأغذية والاستثمار",
      category: "الأغذية والاستثمار",
      order: 5,
      active: true
    },
    {
      name: "مجموعة المعجل",
      logo: "https://almajal.com.sa/wp-content/uploads/2021/03/logo-almajal.png",
      website: "https://almajal.com.sa",
      description: "مجموعة رائدة في مجال التجارة والخدمات",
      category: "التجارة والخدمات",
      order: 6,
      active: true
    }
  ];

  try {
    for (const client of sampleClients) {
      await db.insert(featuredClients).values(client);
    }
    console.log("Featured clients seeded successfully!");
  } catch (error) {
    console.error("Error seeding featured clients:", error);
  }
}