declare module 'react-native-web' {
  export * from 'react-native';
  const ReactNativeWeb: typeof import('react-native');
  export default ReactNativeWeb;
}
