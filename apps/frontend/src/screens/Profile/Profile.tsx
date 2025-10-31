import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../../components/BottomNav/BottomNav';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
