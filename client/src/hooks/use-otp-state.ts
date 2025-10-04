import { useState, useEffect } from 'react';

interface OTPState {
  otpSent: boolean;
  userEmail: string;
  setOtpSent: (value: boolean) => void;
  setUserEmail: (value: string) => void;
  clearOTPState: () => void;
}

export function useOTPState(): OTPState {
  const [otpSent, setOtpSentState] = useState(false);
  const [userEmail, setUserEmailState] = useState("");

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOtpSent = localStorage.getItem('otpSent');
      const savedUserEmail = localStorage.getItem('otpUserEmail');
      
      if (savedOtpSent === 'true' && savedUserEmail) {
        setOtpSentState(true);
        setUserEmailState(savedUserEmail);
      }
    }
  }, []);

  // Sync with localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (otpSent) {
        localStorage.setItem('otpSent', 'true');
        localStorage.setItem('otpUserEmail', userEmail);
      } else {
        localStorage.removeItem('otpSent');
        localStorage.removeItem('otpUserEmail');
      }
    }
  }, [otpSent, userEmail]);

  const setOtpSent = (value: boolean) => {
    setOtpSentState(value);
  };

  const setUserEmail = (value: string) => {
    setUserEmailState(value);
  };

  const clearOTPState = () => {
    setOtpSentState(false);
    setUserEmailState("");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otpSent');
      localStorage.removeItem('otpUserEmail');
    }
  };

  return {
    otpSent,
    userEmail,
    setOtpSent,
    setUserEmail,
    clearOTPState
  };
}
