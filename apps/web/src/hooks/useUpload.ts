import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Send the file directly to our NestJS backend.
      // The backend will handle the transfer to Backblaze B2.
      // This completely avoids any CORS issues because the browser
      // only talks to our own backend API!
      const { data } = await apiClient.post<{ fileUrl: string }>('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
