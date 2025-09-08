/**
 * إنشاء صوت التنبيه برمجياً (لا نحتاج لملف خارجي)
 * هذا يولد نغمة بسيطة ويعيدها كـ blob URL يمكن استخدامه في التنبيهات
 */
export const createNotificationSound = (): string => {
  // إنشاء سياق الصوت
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // المدة الزمنية (بالثواني)
  const duration = 0.2;
  
  // معدل العينات
  const sampleRate = audioContext.sampleRate;
  
  // عدد العينات
  const numSamples = Math.ceil(duration * sampleRate);
  
  // إنشاء buffer الصوت
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  
  // الحصول على البيانات
  const data = buffer.getChannelData(0);
  
  // ملء buffer بنغمة صافرة (2000Hz)
  const frequency = 2000;
  for (let i = 0; i < numSamples; i++) {
    // استخدام دالة الجيب لإنشاء نغمة صافرة
    data[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
    
    // تطبيق خافت تدريجي للصوت (fade out)
    data[i] *= 1 - i / numSamples;
  }
  
  // تحويل buffer الصوت إلى wav
  const wavData = audioBufferToWav(buffer);
  
  // إنشاء Blob من بيانات WAV
  const blob = new Blob([wavData], { type: 'audio/wav' });
  
  // إنشاء عنوان URL للبلوب
  return URL.createObjectURL(blob);
};

// تحويل AudioBuffer إلى تنسيق WAV باستخدام تشفير PCM
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  // احتساب حجم الملف
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  
  // إنشاء ArrayBuffer للملف بأكمله
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  
  // كتابة رأس الملف WAV
  // "RIFF" في little-endian
  view.setUint8(0, 0x52);  // R
  view.setUint8(1, 0x49);  // I
  view.setUint8(2, 0x46);  // F
  view.setUint8(3, 0x46);  // F
  
  // حجم الملف مطروحًا منه 8 بايت
  view.setUint32(4, 36 + dataSize, true);
  
  // "WAVE" في little-endian
  view.setUint8(8, 0x57);   // W
  view.setUint8(9, 0x41);   // A
  view.setUint8(10, 0x56);  // V
  view.setUint8(11, 0x45);  // E
  
  // "fmt " في little-endian
  view.setUint8(12, 0x66);  // f
  view.setUint8(13, 0x6d);  // m
  view.setUint8(14, 0x74);  // t
  view.setUint8(15, 0x20);  // (space)
  
  // حجم قسم fmt (16 للPCM)
  view.setUint32(16, 16, true);
  
  // صيغة الصوت (1 للPCM)
  view.setUint16(20, format, true);
  
  // عدد القنوات
  view.setUint16(22, numOfChannels, true);
  
  // معدل العينات
  view.setUint32(24, sampleRate, true);
  
  // معدل البايتات
  view.setUint32(28, byteRate, true);
  
  // محاذاة البايتات
  view.setUint16(32, blockAlign, true);
  
  // عمق البت
  view.setUint16(34, bitDepth, true);
  
  // "data" في little-endian
  view.setUint8(36, 0x64);  // d
  view.setUint8(37, 0x61);  // a
  view.setUint8(38, 0x74);  // t
  view.setUint8(39, 0x61);  // a
  
  // حجم بيانات الصوت
  view.setUint32(40, dataSize, true);
  
  // كتابة بيانات الصوت
  const offset = 44;
  const buffers = [];
  
  for (let i = 0; i < numOfChannels; i++) {
    buffers.push(buffer.getChannelData(i));
  }
  
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffers[channel][i]));
      const value = Math.floor(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), value, true);
    }
  }
  
  return arrayBuffer;
}