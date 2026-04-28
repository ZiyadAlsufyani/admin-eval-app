import { supabase } from '@/lib/supabase';

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILES_PER_CATEGORY = 2;

/**
 * Uploads an evidence document to the evaluation_evidence bucket.
 * 
 * @param file The file to upload.
 * @param schoolId The ID of the school.
 * @param staffId The ID of the staff member being evaluated.
 * @param weekStartDate The start date of the week (YYYY-MM-DD).
 * @param categoryId The ID of the evaluation category (e.g., 'attendance').
 * @returns The storage path of the uploaded file.
 */
export async function uploadEvaluationEvidence(
  file: File,
  schoolId: string,
  staffId: string,
  weekStartDate: string,
  categoryId: string
): Promise<string> {
  const nameParts = file.name.split('.');
  const fileExt = nameParts.length > 1 ? nameParts.pop() : (file.type.split('/')[1] || 'bin');
  const safeWeekDate = weekStartDate.replace(/[^a-zA-Z0-9-]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  
  // Create a deterministic and secure path
  const filePath = `${schoolId}/${staffId}/${safeWeekDate}/${categoryId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('evaluation_evidence')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading evidence:', error);
    throw error;
  }

  return data.path;
}

/**
 * Retrieves the public URL for an evidence document.
 * 
 * @param path The storage path of the file.
 * @returns The public URL.
 */
export function getEvidenceUrl(path: string): string {
  const { data } = supabase.storage
    .from('evaluation_evidence')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Deletes an evidence document from the bucket.
 * 
 * @param path The storage path of the file to delete.
 */
export async function deleteEvaluationEvidence(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('evaluation_evidence')
    .remove([path]);

  if (error) {
    console.error('Error deleting evidence:', error);
    throw error;
  }
}
