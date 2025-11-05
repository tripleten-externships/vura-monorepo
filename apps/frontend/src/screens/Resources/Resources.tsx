import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavBar } from '../../components/BottomNavBar';

export default function ResourcesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Curated self and elderly care resources</Text>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
