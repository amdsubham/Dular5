import React, { useEffect } from 'react';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { app } from '@/config/firebase';

interface FirebaseRecaptchaProps {
  attemptInvisibleVerification?: boolean;
}

export const FirebaseRecaptcha = React.forwardRef<FirebaseRecaptchaVerifierModal, FirebaseRecaptchaProps>(
  ({ attemptInvisibleVerification = false }, ref) => {
    useEffect(() => {
      console.log('FirebaseRecaptcha component mounted');
      console.log('attemptInvisibleVerification:', attemptInvisibleVerification);
    }, [attemptInvisibleVerification]);

    return (
      <FirebaseRecaptchaVerifierModal
        ref={ref}
        firebaseConfig={app.options}
        attemptInvisibleVerification={attemptInvisibleVerification}
      />
    );
  }
);

FirebaseRecaptcha.displayName = 'FirebaseRecaptcha';

