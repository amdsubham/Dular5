import { storage } from '@/config/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getCurrentUser } from './auth';

/**
 * Upload an image to Firebase Storage and return the download URL
 * @param imageUri - Local URI of the image (from expo-image-picker)
 * @param folder - Folder path in storage (e.g., 'profile-pictures', 'onboarding')
 * @param fileName - Optional custom file name. If not provided, generates a unique name
 * @returns Promise<string> - Download URL of the uploaded image
 */
export const uploadImageToFirebase = async (
  imageUri: string,
  folder: string = 'profile-pictures',
  fileName?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate file name if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const finalFileName = fileName || `image_${timestamp}_${randomString}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `${folder}/${user.uid}/${finalFileName}`);

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Wait for upload to complete
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        () => {
          resolve();
        }
      );
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    console.log('Image uploaded successfully. URL:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Firebase Storage with progress tracking
 * @param imageUris - Array of local URIs
 * @param folder - Folder path in storage
 * @param onProgress - Callback for overall progress (0-100)
 * @returns Promise<string[]> - Array of download URLs
 */
export const uploadMultipleImagesToFirebase = async (
  imageUris: string[],
  folder: string = 'profile-pictures',
  onProgress?: (overallProgress: number, currentImage: number, totalImages: number) => void
): Promise<string[]> => {
  try {
    const downloadURLs: string[] = [];
    const totalImages = imageUris.length;

    for (let index = 0; index < imageUris.length; index++) {
      const uri = imageUris[index];
      const imageProgress = (progress: number) => {
        // Calculate overall progress: (completed images + current image progress) / total
        const overallProgress = ((index / totalImages) * 100) + (progress / totalImages);
        if (onProgress) {
          onProgress(overallProgress, index + 1, totalImages);
        }
      };

      const downloadURL = await uploadImageToFirebase(
        uri,
        folder,
        `image_${index + 1}.jpg`,
        imageProgress
      );
      downloadURLs.push(downloadURL);
    }

    console.log(`Successfully uploaded ${downloadURLs.length} images`);
    return downloadURLs;
  } catch (error: any) {
    console.error('Error uploading multiple images:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - Full URL of the image to delete
 */
export const deleteImageFromFirebase = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);

    await deleteObject(storageRef);
    console.log('Image deleted successfully:', filePath);
  } catch (error: any) {
    console.error('Error deleting image from Firebase Storage:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

