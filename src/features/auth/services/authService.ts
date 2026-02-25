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
