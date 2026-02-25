import type { AuthUser } from '../models/user';

type UserRow = {
  id: string | number;
  name: string;
  email: string;
  password?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjdvfrkegflymfvcpxpf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.');
}

const usersEndpoint = `${supabaseUrl}/rest/v1/users`;

const toAuthUser = (row: Pick<UserRow, 'id' | 'name' | 'email'>): AuthUser => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const buildHeaders = (includeReturn = false): HeadersInit => ({
  'Content-Type': 'application/json',
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  ...(includeReturn ? { Prefer: 'return=representation' } : {}),
});

export const loginWithPassword = async (email: string, password: string): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);
  const query = `?select=id,name,email,password&email=eq.${encodeURIComponent(normalizedEmail)}&password=eq.${encodeURIComponent(password)}&limit=1`;

  const response = await fetch(`${usersEndpoint}${query}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  const data = (await response.json()) as UserRow[] | { message?: string };

  if (!response.ok || !Array.isArray(data)) {
    const message = typeof data === 'object' && data && 'message' in data ? data.message : undefined;
    throw new Error(message || 'ورود ناموفق بود.');
  }

  const user = data[0];
  if (!user) {
    throw new Error('ایمیل یا رمز عبور اشتباه است.');
  }

  return toAuthUser(user);
};

export const signUpWithPassword = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  const existingResponse = await fetch(
    `${usersEndpoint}?select=id&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`,
    {
      method: 'GET',
      headers: buildHeaders(),
    },
  );

  const existingData = (await existingResponse.json()) as Array<{ id: string | number }> | { message?: string };

  if (!existingResponse.ok || !Array.isArray(existingData)) {
    const message =
      typeof existingData === 'object' && existingData && 'message' in existingData
        ? existingData.message
        : undefined;
    throw new Error(message || 'ثبت‌نام ناموفق بود.');
  }

  if (existingData.length > 0) {
    throw new Error('این ایمیل قبلا ثبت شده است.');
  }

  const createResponse = await fetch(usersEndpoint, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({
      name: trimmedName,
      email: normalizedEmail,
      password,
    }),
  });

  const createdData = (await createResponse.json()) as UserRow[] | { message?: string };

  if (!createResponse.ok || !Array.isArray(createdData) || createdData.length === 0) {
    const message =
      typeof createdData === 'object' && createdData && 'message' in createdData
        ? createdData.message
        : undefined;
    throw new Error(message || 'ثبت‌نام ناموفق بود.');
  }

  return toAuthUser(createdData[0]);
};

export const updateProfile = async (userId: string, name: string, email: string): Promise<AuthUser> => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || !normalizedEmail) {
    throw new Error('نام و ایمیل الزامی است.');
  }

  const existingResponse = await fetch(
    `${usersEndpoint}?select=id,email&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`,
    {
      method: 'GET',
      headers: buildHeaders(),
    },
  );

  const existingData = (await existingResponse.json()) as Array<{ id: string | number; email: string }> | { message?: string };

  if (!existingResponse.ok || !Array.isArray(existingData)) {
    const message =
      typeof existingData === 'object' && existingData && 'message' in existingData
        ? existingData.message
        : undefined;
    throw new Error(message || 'به‌روزرسانی حساب انجام نشد.');
  }

  if (existingData.length > 0 && String(existingData[0].id) !== userId) {
    throw new Error('این ایمیل قبلا ثبت شده است.');
  }

  const response = await fetch(`${usersEndpoint}?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: buildHeaders(true),
    body: JSON.stringify({
      name: trimmedName,
      email: normalizedEmail,
    }),
  });

  const data = (await response.json()) as UserRow[] | { message?: string };

  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    const message = typeof data === 'object' && data && 'message' in data ? data.message : undefined;
    throw new Error(message || 'به‌روزرسانی حساب انجام نشد.');
  }

  return toAuthUser(data[0]);
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  if (!currentPassword || !newPassword) {
    throw new Error('رمز فعلی و رمز جدید الزامی است.');
  }

  const verifyResponse = await fetch(
    `${usersEndpoint}?select=id&id=eq.${encodeURIComponent(userId)}&password=eq.${encodeURIComponent(currentPassword)}&limit=1`,
    {
      method: 'GET',
      headers: buildHeaders(),
    },
  );

  const verifyData = (await verifyResponse.json()) as Array<{ id: string | number }> | { message?: string };

  if (!verifyResponse.ok || !Array.isArray(verifyData)) {
    const message =
      typeof verifyData === 'object' && verifyData && 'message' in verifyData ? verifyData.message : undefined;
    throw new Error(message || 'تغییر رمز عبور انجام نشد.');
  }

  if (verifyData.length === 0) {
    throw new Error('رمز عبور فعلی اشتباه است.');
  }

  const updateResponse = await fetch(`${usersEndpoint}?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({
      password: newPassword,
    }),
  });

  if (!updateResponse.ok) {
    const payload = (await updateResponse.json()) as { message?: string };
    throw new Error(payload.message || 'تغییر رمز عبور انجام نشد.');
  }
};

export const deleteAccount = async (userId: string): Promise<void> => {
  await fetch(`${supabaseUrl}/rest/v1/meetings?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  const response = await fetch(`${usersEndpoint}?id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message || 'حذف حساب انجام نشد.');
  }
};
