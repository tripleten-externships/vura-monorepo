import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../../components/BottomNav/BottomNav';

export default function ChecklistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your care action plan</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
