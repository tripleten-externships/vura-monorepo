import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavBar } from '../../components/BottomNavBar';

export default function CommunityForumsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find support and answer here</Text>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
