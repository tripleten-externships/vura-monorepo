export function isItemAccess(args: any): args is { item: any } {
  return 'item' in args;
}
