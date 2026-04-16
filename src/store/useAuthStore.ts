import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: any;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  setUser: (user: FirebaseUser | null) => void;
  fetchProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAuthReady: false,
  setUser: (user) => set({ user, isAuthReady: true }),
  fetchProfile: async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ profile: docSnap.data() as UserProfile });
      } else {
        // Create user profile if it doesn't exist
        const email = auth.currentUser?.email || '';
        const newProfile: UserProfile = {
          uid,
          email,
          displayName: auth.currentUser?.displayName || 'User',
          role: email === 'youceffeddag1@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, newProfile);
        set({ profile: newProfile });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },
}));
