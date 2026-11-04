export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
  if (!values.username?.trim()) errors.username = "Choose an explorer name.";
  else if (values.username.trim().length < 3) errors.username = "Explorer name must be at least 3 characters.";
  else if (values.username.trim().length > 24) errors.username = "Explorer name must be 24 characters or fewer.";
  if (values.password && (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))) errors.password = "Use at least one letter and one number.";
  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
