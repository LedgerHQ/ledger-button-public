/**
 * Formats an address to display a truncated version with ellipsis.
 * Example: "0xC5D2460186F7233C927E7DB2DCC703C0E500B653CA82273B7BFAD8045D85A470" -> "0xC5...A470"
 *
 * @param address - The full address string to format
 * @returns The formatted address with first 4 characters + "..." + last 4 characters
 */
export function formatAddress(address: string): string {
  if (!address || address.length <= 8) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
