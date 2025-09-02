// utils/firebase-error.utils.ts
export function handleFirebaseError(error: unknown): string {
  if (error instanceof Error) {
    // Firebase auth errors have specific codes
    const firebaseError = error as any;

    switch (firebaseError.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred';
}

// Usage in your component

