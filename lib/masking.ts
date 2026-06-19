export function maskPhone(phone: string): string {
  if (phone.length < 7) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}
