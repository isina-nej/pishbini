const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("98") && digits.length === 12) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("9") && digits.length === 10) {
    digits = "0" + digits;
  }

  if (!IRAN_MOBILE_REGEX.test(digits)) {
    return null;
  }

  return digits;
}

export function isValidIranianMobile(input: string): boolean {
  return normalizePhone(input) !== null;
}
