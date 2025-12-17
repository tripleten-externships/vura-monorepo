import React from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  selectedValue: string | null;
  onSelectionChange: (value: string) => void;
  title?: string;
  errorMessage?: string;
  disabled?: boolean;
  otherTextValue?: string;
  onOtherTextChange?: (text: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  selectedValue,
  onSelectionChange,
  title,
  errorMessage,
  disabled = false,
  otherTextValue,
  onOtherTextChange,
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionContainer,
              selectedValue === option.value && styles.selectedOption,
              disabled && styles.disabledOption,
            ]}
            onPress={() => !disabled && onSelectionChange(option.value)}
            activeOpacity={disabled ? 1 : 0.7}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedValue === option.value }}
            accessibilityLabel={option.label}
          >
            <View style={styles.optionContent}>
              <View style={styles.radioButton}>
                <View
                  style={[
                    styles.radioCircle,
                    selectedValue === option.value && styles.selectedCircle,
                    disabled && styles.disabledCircle,
                  ]}
                >
                  {selectedValue === option.value && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.textContainer}>
                {option.value === 'other' ? (
                  selectedValue === 'other' && onOtherTextChange ? (
                    <TextInput
                      placeholder="Other, please write"
                      placeholderTextColor="#999999"
                      value={otherTextValue || ''}
                      onChangeText={onOtherTextChange}
                      multiline={false}
                      maxLength={100}
                      style={styles.otherTextInput}
                      autoFocus={true}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedValue === option.value && styles.selectedLabel,
                        !selectedValue && styles.placeholderLabel,
                        disabled && styles.disabledLabel,
                      ]}
                    >
                      {option.label}
                    </Text>
                  )
                ) : (
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedValue === option.value && styles.selectedLabel,
                      disabled && styles.disabledLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                )}
                {/* Description text removed as requested */}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 44, // Calculated: 160px (center) - 116px (half of estimated container height)
    left: 24,
    right: 24, // This with left: 24 centers the content horizontally
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: '#363636',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.34,
    fontFamily: 'Noto Serif',
    width: 317,
    height: 88,
    alignSelf: 'center', // Centers the title element within the container
  },
  optionsContainer: {
    gap: 12,
    marginTop: 40,
    alignItems: 'center',
  },
  optionContainer: {
    borderWidth: 2,
    borderColor: '#E7E7E7',
    borderRadius: 28,
    backgroundColor: '#F6F4FA',
    minHeight: 60,
    width: 345,
    height: 76,
  },
  selectedOption: {
    backgroundColor: '#E8F4FD',
    borderColor: '#4A90E2',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    flex: 1,
    height: '100%',
  },
  radioButton: {
    marginRight: 0,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    borderColor: '#363636',
  },
  disabledCircle: {
    borderColor: '#CCCCCC',
  },
  radioInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#363636',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#363636',
    lineHeight: 20,
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#363636',
    fontWeight: '600',
  },
  disabledLabel: {
    color: '#999999',
  },
  placeholderLabel: {
    color: '#999999',
    fontWeight: '400',
  },
  otherTextInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#363636',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 0,
    minHeight: 20,
    backgroundColor: 'transparent',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
  },
  disabledDescription: {
    color: '#CCCCCC',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RadioGroup;
