
// Simple validation functions
export const validateEmail = (email: string): boolean => {
  return email.includes('@') && email.includes('.');
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 3; // Very simple requirement
};

export const sanitizeInput = (input: string): string => {
  return input.trim();
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
