import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept = {
    "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  label = "رفع ملف",
  helperText = "اسحب وأفلت الملف هنا، أو انقر للاختيار",
  error,
  maxFiles = 1,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFileError(null);

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onChange(file);

        // Create a preview URL for image files
        if (file.type.startsWith("image/")) {
          const objectUrl = URL.createObjectURL(file);
          setPreview(objectUrl);
        } else {
          setPreview(null);
        }
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    maxFiles,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === "file-too-large") {
        setFileError(`الملف كبير جداً، الحد الأقصى هو ${maxSize / (1024 * 1024)} ميجابايت`);
      } else if (rejection.errors[0].code === "file-invalid-type") {
        setFileError("نوع الملف غير مدعوم");
      } else {
        setFileError("حدث خطأ أثناء رفع الملف");
      }
    },
  });

  const removeFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    onChange(null);
    setPreview(null);
    setFileError(null);
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}

      {value || preview ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {value?.name || "ملف مرفق"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {preview && value?.type.startsWith("image/") && (
            <div className="mt-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded border border-gray-200 mx-auto"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps({
            className: `border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 
              ${isDragActive ? "border-primary bg-primary/10" : ""}
              ${error || fileError ? "border-red-500 dark:border-red-500" : ""}
              transition-colors duration-200 cursor-pointer`,
          })}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium mb-1">{helperText}</p>
            <p className="text-xs text-gray-500">
              أقصى حجم للملف: {maxSize / (1024 * 1024)} ميجابايت
            </p>
          </div>
        </div>
      )}

      {(error || fileError) && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || fileError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { FileUpload };