import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../../components/BottomNav/BottomNav';

export default function ResourcesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Curated self and elderly care resources</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
