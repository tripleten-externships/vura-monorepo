import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  ImageStyle,
  TextStyle,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';

export interface InputProps {
  value?: string;
  placeholder: string;
  onChange?: (value: string) => void;
  svgIcon?: ImageSourcePropType;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  iconStyle?: ImageStyle;
  placeholderTextColor: string;
}

export const InputField = ({
  value,
  placeholder,
  onChange,
  secureTextEntry,
  containerStyle,
  inputStyle,
  iconStyle,
  placeholderTextColor,
  svgIcon,
}: InputProps) => {
  // use useState to store and update the value of the input field
  const [inputValue, setInputValue] = useState('');

  // update input value whenever it changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);
  // update the input value and notify the parent component
  const handleChange = (text: string) => {
    setInputValue(text);
    onChange?.(text);
  };

  //// render input field with optional icon and custom styles
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        value={inputValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={secureTextEntry}
      />
      {svgIcon && <Image source={svgIcon} style={[styles.icon, iconStyle]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#000',
  },
  icon: {
    marginLeft: 8,
    width: 24,
    height: 24,
  },
});
