import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavBar } from '../../components/BottomNavBar';

export default function ChecklistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your care action plan</Text>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
