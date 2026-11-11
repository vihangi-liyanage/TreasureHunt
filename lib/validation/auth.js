export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateUsername(value) {
  if (!value?.trim()) return "Choose a username.";
  if (value.trim().length < 3) return "Username must be at least 3 characters.";
  if (value.trim().length > 24) return "Username must be 24 characters or fewer.";
  if (!/^[A-Za-z0-9_-]+$/.test(value.trim())) return "Use only letters, numbers, underscores, or hyphens.";
  return null;
}

export function validateLogin(values) {
  const errors = {};
  if (!values.email?.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  else if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export function validateRegister(values) {
  const errors = validateLogin(values);
  const usernameError = validateUsername(values.username);
  if (usernameError) errors.username = usernameError;
  if (values.password && (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))) errors.password = "Use at least one letter and one number.";
  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
