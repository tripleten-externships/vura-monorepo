import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PeerGroupCardProps {
  initials: string;
  name: string;
  age: string;
  description: string;
  onPress?: () => void;
}
//clickable card component for displaying peer group members
export default function PeerGroupCard({
  initials,
  name,
  age,
  description,
  onPress,
}: PeerGroupCardProps) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
      {/* Initials Circle */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* User Info */}
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.age}>{age}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 345,
    height: 77,
    backgroundColor: '#F6F4FA',
    borderColor: '#E7E7E7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    opacity: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 4,
  },
  age: {
    fontSize: 14,
    color: '#999999',
  },
  description: {
    fontSize: 13,
    color: '#777777',
  },
});
