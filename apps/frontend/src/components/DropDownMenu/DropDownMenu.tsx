import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Platform } from 'react-native';

interface DropdownProps {
  label?: string; //label for dropdown
  placeholder?: string; //Placeholder text when nothing is selected
  options: string[]; // List of items to choose from
  onSelect: (value: string) => void; // Called when user selects an option
  selectedValue?: string; // Current selected value
  onVisibilityChange?: (visible: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  onSelect,
  selectedValue,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const isWeb = Platform.OS === 'web';
  const setVisible = (visible: boolean) => {
    setIsVisible(visible);
    onVisibilityChange?.(visible);
  };

  return (
    <View style={[styles.container, isVisible && styles.containerOpen]}>
      {/*Label for dropdown*/}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Dropdown button */}
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setVisible(!isVisible)}>
        <Text style={styles.dropdownText}>{selectedValue || placeholder}</Text>
      </TouchableOpacity>

      {isWeb ? (
        isVisible && (
          <View style={styles.webDropdown}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )
      ) : (
        <Modal visible={isVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setVisible(false)}
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
                      setVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default Dropdown;

//style needs work
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    position: 'relative',
  },
  containerOpen: {
    zIndex: 50,
    elevation: 10,
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
  webDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 10,
    maxHeight: 240,
    padding: 10,
    zIndex: 60,
    elevation: 11,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  option: {
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
});
