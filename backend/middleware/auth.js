import bcrypt from 'bcryptjs';

export async function validatePortalLogin(storedUsername, storedPassword, username, password) {
  if (username !== storedUsername) {
    return false;
  }

  const normalizedStored = String(storedPassword || '');
  const normalizedPassword = String(password || '');

  if (!normalizedStored) {
    return false;
  }

  if (normalizedStored === normalizedPassword) {
    return true;
  }

  try {
    return await bcrypt.compare(normalizedPassword, normalizedStored);
  } catch {
    return false;
  }
}
