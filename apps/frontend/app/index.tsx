import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProtectedRoute from '../src/components/protected-route';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to BetterHunt Vura</Text>
        <Text style={styles.subtitle}>Your home page</Text>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
