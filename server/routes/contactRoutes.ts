import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// التحقق من صلاحيات المسؤول
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Forbidden - Admin access required' });
};

// إضافة رسالة اتصال جديدة (متاح للجميع)
router.post('/api/contact-messages', async (req: Request, res: Response) => {
  try {
    const messageData = insertContactMessageSchema.parse(req.body);
    
    // تحقق من صحة البريد الإلكتروني
    if (!messageData.email.includes('@')) {
      return res.status(400).json({ message: 'البريد الإلكتروني غير صالح' });
    }
    
    // إنشاء الرسالة في قاعدة البيانات
    const contactMessage = await storage.createContactMessage(messageData);
    
    res.status(201).json({ 
      success: true, 
      message: 'تم استلام رسالتك بنجاح، سنتواصل معك قريباً', 
      contactMessage 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'خطأ في البيانات المدخلة', errors: error.errors });
    }
    console.error('خطأ في إرسال رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء معالجة طلبك' });
  }
});

// جلب جميع رسائل الاتصال (للمسؤول فقط)
router.get('/api/contact-messages', isAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await storage.getContactMessages();
    res.json(messages);
  } catch (error) {
    console.error('خطأ في استرجاع رسائل الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب رسائل الاتصال' });
  }
});

// جلب رسالة اتصال واحدة حسب المعرف (للمسؤول فقط)
router.get('/api/contact-messages/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    const message = await storage.getContactMessageById(id);
    if (!message) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }
    
    // تحديث حالة الرسالة إلى "مقروءة" إذا كانت جديدة
    if (message.status === 'new') {
      await storage.updateContactMessageStatus(id, 'read');
    }
    
    res.json(message);
  } catch (error) {
    console.error('خطأ في استرجاع رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب رسالة الاتصال' });
  }
});

// تحديث حالة رسالة الاتصال (للمسؤول فقط)
router.patch('/api/contact-messages/:id/status', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    const { status } = req.body;
    if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة' });
    }
    
    const updatedMessage = await storage.updateContactMessageStatus(id, status);
    if (!updatedMessage) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('خطأ في تحديث حالة رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة الرسالة' });
  }
});

// إضافة ملاحظة إلى رسالة الاتصال (للمسؤول فقط)
router.patch('/api/contact-messages/:id/notes', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ message: 'الملاحظات مطلوبة' });
    }
    
    const updatedMessage = await storage.addNoteToContactMessage(id, notes);
    if (!updatedMessage) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('خطأ في إضافة ملاحظة إلى رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة الملاحظة' });
  }
});

// الرد على رسالة الاتصال (للمسؤول فقط)
router.post('/api/contact-messages/:id/reply', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ message: 'نص الرد مطلوب' });
    }
    
    const updatedMessage = await storage.replyToContactMessage(id, replyMessage);
    if (!updatedMessage) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }
    
    // هنا يمكن إضافة رمز لإرسال بريد إلكتروني إلى المرسل بالرد
    // يمكن استخدام خدمة البريد الإلكتروني المستخدمة بالفعل في النظام
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('خطأ في الرد على رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء الرد على الرسالة' });
  }
});

// حذف رسالة اتصال (للمسؤول فقط)
router.delete('/api/contact-messages/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    const deleted = await storage.deleteContactMessage(id);
    if (!deleted) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف رسالة الاتصال:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الرسالة' });
  }
});

export default router;