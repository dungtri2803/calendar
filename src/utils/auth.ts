const EMPLOYEE_PIN_SALT = 'staffflow-employee-pin-v1';

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export async function hashEmployeePin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${EMPLOYEE_PIN_SALT}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyEmployeePin(pin: string, expectedHash?: string): Promise<boolean> {
  if (!expectedHash || !isValidPin(pin)) return false;
  const actualHash = await hashEmployeePin(pin);
  return actualHash === expectedHash;
}
