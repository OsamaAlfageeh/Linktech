import { useState, useCallback, forwardRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { CloudUpload, File, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface UploadedFile {
  id: string;
  name: string;
  url: string; 
  type: string;
  size: number;
  uploadedAt: string;
}

export interface DropzoneUploaderProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  onFilesChange?: (files: UploadedFile[]) => void;
  initialFiles?: UploadedFile[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: Record<string, string[]>;
  uploadPath?: string;
  className?: string;
  disabled?: boolean;
}

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Simulate file upload to server
const uploadFileToServer = async (file: File): Promise<string> => {
  // In a real implementation, this would be a request to your server to upload the file
  // For now, we'll convert to a data URL as a placeholder
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  });
};

export const DropzoneUploader = forwardRef<HTMLDivElement, DropzoneUploaderProps>(({
  value = [],
  onChange,
  onFilesChange,
  initialFiles = [],
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc', '.docx'],
    'application/vnd.ms-excel': ['.xls', '.xlsx']
  },
  uploadPath = '/upload',
  className,
  disabled = false
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles.length > 0 ? initialFiles : value);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    // Validate maximum files
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;
    
    // Only take what we can fit
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);
    
    setIsUploading(true);
    
    try {
      const newFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          const url = await uploadFileToServer(file);
          const newFile: UploadedFile = {
            id: generateUniqueId(),
            name: file.name,
            url,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };
          return newFile;
        })
      );
      
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      if (onChange) onChange(updatedFiles);
      if (onFilesChange) onFilesChange(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files, maxFiles, disabled, onChange, onFilesChange]);

  const removeFile = (fileId: string) => {
    if (disabled) return;
    
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    if (onChange) onChange(updatedFiles);
    if (onFilesChange) onFilesChange(updatedFiles);
  };
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    maxSize,
    disabled: disabled || isUploading || files.length >= maxFiles,
    accept: acceptedFileTypes,
    noClick: true, // Disable click to avoid double triggers
    noKeyboard: true
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return null; // Will display a thumbnail
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  return (
    <div className={cn("space-y-4", className)} ref={ref}>
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragActive 
            ? "border-primary bg-primary/10" 
            : "border-gray-300 hover:border-primary",
          disabled && "opacity-50 cursor-not-allowed",
          files.length >= maxFiles && "opacity-50"
        )}
      >
        <Input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <CloudUpload className="h-12 w-12 text-gray-400" />
          
          <div className="text-gray-600">
            {isDragActive ? (
              <p className="font-medium text-primary">أفلت الملفات هنا للرفع</p>
            ) : (
              <div>
                <p className="font-medium">اسحب وأفلت الملفات هنا، أو</p>
                <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={open}
                  disabled={disabled || files.length >= maxFiles}
                  className="mx-1"
                >
                  تصفح ملفاتك
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            بحد أقصى {maxFiles} ملفات. الحد الأقصى: {(maxSize / (1024 * 1024)).toFixed(0)} ميجابايت لكل ملف.
            <br />
            الصيغ المقبولة: jpg, png, gif, pdf, doc, xls
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
          <div className="loading-spinner ml-2" aria-label="جاري الرفع..."></div>
          <span>جاري رفع الملفات...</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">الملفات المرفقة ({files.length}/{maxFiles})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-4 rtl:space-x-reverse bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-white border flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(0)} كيلوبايت
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">إزالة الملف</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

DropzoneUploader.displayName = 'DropzoneUploader';