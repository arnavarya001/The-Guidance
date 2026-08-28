import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for 'The Guidance'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA6ByUFI8ob359013HcQJ0pKw0iAjw_naA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-guidance-36bed.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-guidance-36bed",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-guidance-36bed.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "118908986157",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:118908986157:web:e0e928e94763f8bf8269a4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NH32Y0T9PJ"
};

// Initialize Firebase once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);

/**
 * Uploads a PDF file directly to Firebase Storage with progress tracking
 * @param {File} file - PDF file to upload
 * @param {string} folder - Target folder in bucket (default: 'study_materials')
 * @param {function} onProgress - Progress callback with percentage (0-100)
 * @returns {Promise<string>} Download URL of the uploaded file
 */
export const uploadPdfToFirebase = (file, folder = 'study_materials', onProgress = () => {}) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected"));
    
    // Clean filename and create unique storage path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;
    const fileRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type || 'application/pdf'
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export default app;
