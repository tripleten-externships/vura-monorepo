import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

interface DropdownProps {
  label?: string; //label for dropdown
  placeholder?: string; //Placeholder text when nothing is selected
  options: string[]; // List of items to choose from
  onSelect: (value: string) => void; // Called when user selects an option
  selectedValue?: string; // Current selected value
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, onSelect, selectedValue }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/*Label for dropdown*/}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Dropdown button */}
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.dropdownText}>{selectedValue || 'Select an option'}</Text>
      </TouchableOpacity>

      {/* Modal with options */}
      <Modal visible={isVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setIsVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Dropdown;

//style needs work
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F6F4FA',
  },
  dropdownText: {
    fontSize: 18,
    color: '#3636368e',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F4FA',
  },
  modalContent: {
    backgroundColor: '#F6F4FA',
    borderRadius: 10,
    width: '80%',
    maxHeight: '60%',
    padding: 10,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
});
