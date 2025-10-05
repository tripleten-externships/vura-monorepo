export function decodeCursor(cursor: string): any {
  // Implement your decode logic here
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}

export function encodeCursor(data: any): string {
  // Implement your encode logic here
  return Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
}
