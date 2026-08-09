const MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  ACCOUNT_SUSPENDED: 'This account has been suspended.',
  OAUTH_ACCOUNT_NO_PASSWORD: 'This account uses Google/Apple sign-in — try that instead.',
  VALIDATION_ERROR: 'Please check the fields and try again.',
  REGISTER_FAILED: 'Could not create your account. Please try again.',
  LOGIN_FAILED: 'Could not log in. Please try again.',
};

export function describeAuthError(code: string | null): string {
  if (!code) return 'Something went wrong. Please try again.';
  return MESSAGES[code] ?? 'Something went wrong. Please try again.';
}
