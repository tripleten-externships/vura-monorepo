import React from 'react';
import { ImageBackground, View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import checkMark from '../../assets/checkMark.png';

interface CheckboxProps {
  label?: string; //Label for checkbox
  checked: boolean; //Check for checkbox
  onChange: (newValue: boolean) => void; //onChange event for checkbox
}

function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange(!checked)} //Checks if its checked
        activeOpacity={0.8}
      >
        {checked ? (
          <ImageBackground
            source={checkMark} //Adds the checked image if checked
            style={[styles.checkbox, styles.checkMark]}
            imageStyle={{ borderRadius: 6 }}
          />
        ) : (
          <View style={styles.checkbox} />
        )}
        {/* label for checkbox */}
        {label && <Text style={styles.label}>{label}</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default Checkbox;

const styles = StyleSheet.create({
  //Container card
  container: {
    width: 345,
    height: 103,
    borderColor: '#E7E7E7',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#F6F4FA',
    justifyContent: 'center',
  },

  //Row layout for checkbox and label
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  //Unchecked box
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  //Checked image
  checkMark: {
    borderWidth: 0,
  },

  //Label text
  label: {
    fontSize: 16,
    color: 'Black',
  },
});
