import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

interface ToggleButtonProps {
  labels: [string, string];
  activeIndex?: number; // shows which tab is active
  onToggle?: (index: number) => void; // Callback when toggled
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ labels, activeIndex = 0, onToggle }) => {
  const [selected, setSelected] = useState(activeIndex);

  const handleToggle = (index: number) => {
    setSelected(index);
    onToggle?.(index); // only calling parent function if provided
  };
  return (
    <View style={styles.container}>
      {labels.map((label, index) => (
        <TouchableOpacity // makes each label pressable (comes with React Native)
          key={label}
          style={[styles.tab, selected === index ? styles.tabActive : styles.tabInactive]}
          onPress={() => handleToggle(index)}
        >
          <Text
            style={[styles.label, selected === index ? styles.labelActive : styles.labelInactive]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F4FA',
    overflow: 'hidden',
    borderRadius: 14,
  },
  tab: {
    padding: 24,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabInactive: {
    backgroundColor: '#F6F4FA',
  },
  label: {
    fontSize: 16,
  },
  labelActive: {
    color: '#000000',
  },
  labelInactive: {
    color: '#36363680',
  },
});

export default ToggleButton;
