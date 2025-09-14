// إعلانات النماذج لتجنب أخطاء TypeScript
declare module 'fs-extra';
declare module 'arabic-reshaper';
declare module 'bidi-js';
declare module 'pdfmake/src/printer';

// تمديد واجهة Express Request لإضافة خاصية user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}