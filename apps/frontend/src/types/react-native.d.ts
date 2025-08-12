declare module 'react-native' {
  export * from 'react-native-web';
  export { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native-web';
}

declare module 'expo-router' {
  export * from 'expo-router';
  export { Stack } from 'expo-router/stack';
  export { router } from 'expo-router';
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  };
  export default AsyncStorage;
}
