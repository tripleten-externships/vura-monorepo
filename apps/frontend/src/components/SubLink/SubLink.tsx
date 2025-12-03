import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SubLinkProps {
  text: string; //Text shown inside the sublink
  onPress?: () => void; //Action when pressed
}

export default function SubLink({ text, onPress }: SubLinkProps) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.textWrapper}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  //Outer container, keeps touchable area aligned
  container: {
    width: 297,
    height: 38,
    justifyContent: 'center',
    opacity: 1,
  },

  // Inner layout for text and arrow
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Text styling
  text: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16 * 1.2, // 120%
    color: '#36363680',
    letterSpacing: 0,
    marginRight: 4,
  },
  arrow: {
    fontSize: 16,
    color: '#36363680',
  },
});
