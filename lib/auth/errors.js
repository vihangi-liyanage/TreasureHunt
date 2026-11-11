const PUBLIC_AUTH_ERRORS = Object.freeze({
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed: "Confirm your email before signing in.",
  user_already_exists: "An account already exists for this email.",
  weak_password: "Choose a stronger password and try again.",
  signup_disabled: "New account registration is currently unavailable.",
  over_email_send_rate_limit: "Please wait before requesting another email.",
  over_request_rate_limit: "Too many attempts. Please wait and try again.",
});

export function getPublicAuthError(error) {
  if (!error) return "Authentication could not be completed.";
  if (error.status === 429) return PUBLIC_AUTH_ERRORS.over_request_rate_limit;
  return PUBLIC_AUTH_ERRORS[error.code] || "Authentication could not be completed. Please try again.";
}
