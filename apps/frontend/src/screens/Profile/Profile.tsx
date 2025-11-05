import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavBar } from '../../components/BottomNavBar';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
