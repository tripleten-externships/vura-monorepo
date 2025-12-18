import React from 'react';
import { MemoryRouter } from 'react-router';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppRoutes } from './AppRoutes';

export function AppNavigator() {
  return (
    <MemoryRouter>
      <NavigatorContent />
    </MemoryRouter>
  );
}

const NavigatorContent = () => {
  const containerStyle = [styles.shell, { height: '100vh' } as unknown as ViewStyle];

  return (
    <View style={containerStyle}>
      <View style={styles.header}></View>
      <View style={styles.content}>
        <AppRoutes />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F4F1F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#F7F5F8',
  },
  content: {
    flex: 1,
  },
});
