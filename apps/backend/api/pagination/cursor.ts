/**
 * Decodes a base64-encoded cursor string into an object
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor object
 * @throws Error if cursor is invalid or cannot be decoded
 */
export function decodeCursor(cursor: string): unknown {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid cursor encoding');
  }
}

/**
 * Encodes an object into a base64-encoded cursor string
 * @param data - Data object to encode
 * @returns Base64-encoded cursor string
 */
export function encodeCursor(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data);
  return Buffer.from(jsonString, 'utf-8').toString('base64');
}
