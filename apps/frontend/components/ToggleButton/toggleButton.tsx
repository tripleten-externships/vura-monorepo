import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    <View className="flex-row justify-center items-center bg-[#F6F4FA] overflow-hidden rounded-[14px]">
      {labels.map((label, index) => (
        <TouchableOpacity //makes each label pressable (comes with React Native)
          key={label}
          className={`p-6 rounded-[10px] ${selected === index ? 'bg-white' : 'bg-[#F6F4FA]'}`}
          onPress={() => handleToggle(index)}
        >
          <Text className={`${selected === index ? 'text-black-16px' : 'text-[#36363680]-16px'}`}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ToggleButton;
