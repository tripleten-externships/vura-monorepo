import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../../components/BottomNav/BottomNav';

export default function CommunityForumsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find support and answer here</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {},
});
