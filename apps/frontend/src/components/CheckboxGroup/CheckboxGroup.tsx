import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onSelectionChange: (value: string) => void;
  title?: string;
  errorMessage?: string;
  disabled?: boolean;
  minSelections?: number;
  maxSelections?: number;
  allowSelectAll?: boolean;
  layout?: 'vertical' | 'grid';
  columns?: number;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  title,
  errorMessage,
  disabled = false,
  minSelections = 0,
  maxSelections,
  allowSelectAll = false,
  layout = 'vertical',
  columns = 2,
}) => {
  // Handle individual checkbox toggle
  const handleToggle = (value: string) => {
    if (disabled) return;

    const isCurrentlySelected = selectedValues.includes(value);

    // Check if we can add more selections
    if (!isCurrentlySelected && maxSelections && selectedValues.length >= maxSelections) {
      return; // Don't allow more selections if at max
    }

    onSelectionChange(value);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (disabled) return;

    if (selectedValues.length === options.length) {
      // If all are selected, clear all
      selectedValues.forEach((value) => onSelectionChange(value));
    } else {
      // Select all remaining options
      options.forEach((option) => {
        if (!selectedValues.includes(option.value)) {
          onSelectionChange(option.value);
        }
      });
    }
  };

  // Render individual checkbox item
  const renderCheckboxItem = (option: CheckboxOption, index: number) => {
    const isSelected = selectedValues.includes(option.value);
    const isDisabled =
      disabled || (!isSelected && maxSelections && selectedValues.length >= maxSelections);

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.checkboxContainer,
          layout === 'grid' ? styles.checkboxContainerGrid : null,
          isSelected ? styles.checkboxContainerSelected : null,
          isDisabled ? styles.checkboxContainerDisabled : null,
        ]}
        onPress={() => handleToggle(option.value)}
        activeOpacity={isDisabled ? 1 : 0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected, disabled: Boolean(isDisabled) }}
        accessibilityLabel={option.label}
        accessibilityHint={option.description}
      >
        <View style={styles.checkboxContent}>
          <View style={styles.checkboxButton}>
            <View
              style={[
                styles.checkboxSquare,
                isSelected ? styles.checkboxSquareSelected : null,
                isDisabled ? styles.checkboxSquareDisabled : null,
              ]}
            >
              {isSelected && <Text style={styles.checkmarkText}>✓</Text>}
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.checkboxLabel,
                isSelected ? styles.checkboxLabelSelected : null,
                isDisabled ? styles.checkboxLabelDisabled : null,
              ]}
            >
              {option.label}
            </Text>
            {option.description && (
              <Text
                style={[
                  styles.checkboxDescription,
                  isDisabled ? styles.checkboxDescriptionDisabled : null,
                ]}
              >
                {option.description}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render options based on layout
  const renderOptions = () => {
    if (layout === 'grid') {
      const rows = Math.ceil(options.length / columns);
      const gridItems = [];

      for (let row = 0; row < rows; row++) {
        const rowItems = [];
        for (let col = 0; col < columns; col++) {
          const index = row * columns + col;
          if (index < options.length) {
            rowItems.push(
              <View key={options[index].value} style={styles.gridItem}>
                {renderCheckboxItem(options[index], index)}
              </View>
            );
          } else {
            rowItems.push(<View key={`empty-${index}`} style={styles.gridItem} />);
          }
        }
        gridItems.push(
          <View key={row} style={styles.gridRow}>
            {rowItems}
          </View>
        );
      }

      return <View style={styles.gridContainer}>{gridItems}</View>;
    }

    // Vertical layout
    return (
      <View style={styles.verticalContainer}>
        {options.map((option, index) => renderCheckboxItem(option, index))}
      </View>
    );
  };

  const allSelected = selectedValues.length === options.length;
  const noneSelected = selectedValues.length === 0;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Select All button */}
      {allowSelectAll && (
        <TouchableOpacity
          style={[
            styles.selectAllButton,
            allSelected && styles.selectAllButtonSelected,
            disabled && styles.selectAllButtonDisabled,
          ]}
          onPress={disabled ? undefined : handleSelectAll}
          activeOpacity={disabled ? 1 : 0.7}
          accessibilityRole="button"
          accessibilityLabel={allSelected ? 'Deselect all' : 'Select all'}
          accessibilityState={{ disabled }}
        >
          <Text
            style={[
              styles.selectAllText,
              allSelected && styles.selectAllTextSelected,
              disabled && styles.selectAllTextDisabled,
            ]}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Options */}
      <ScrollView
        style={styles.optionsScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsScrollContent}
      >
        {renderOptions()}
      </ScrollView>

      {/* Selection count and error */}
      <View style={styles.bottomRow}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <Text style={styles.selectionCount}>
            {selectedValues.length} of {options.length} selected
            {minSelections > 0 && ` (min: ${minSelections})`}
            {maxSelections && ` (max: ${maxSelections})`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#363636',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectAllButton: {
    backgroundColor: '#F6F4FA',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  selectAllButtonSelected: {
    backgroundColor: '#363636',
    borderColor: '#363636',
  },
  selectAllButtonDisabled: {
    opacity: 0.5,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#363636',
    textAlign: 'center',
  },
  selectAllTextSelected: {
    color: '#FFFFFF',
  },
  selectAllTextDisabled: {
    color: '#999999',
  },
  optionsScrollView: {
    maxHeight: 400, // Prevent excessive height
  },
  optionsScrollContent: {
    paddingBottom: 8,
  },
  verticalContainer: {
    gap: 12,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  checkboxContainer: {
    borderWidth: 2,
    borderColor: '#E7E7E7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  checkboxContainerGrid: {
    minHeight: 80,
  },
  checkboxContainerSelected: {
    borderColor: '#363636',
    backgroundColor: '#F6F4FA',
    shadowColor: '#363636',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxContainerDisabled: {
    opacity: 0.5,
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  checkboxButton: {
    marginRight: 12,
    marginTop: 2, // Align with first line of text
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareSelected: {
    borderColor: '#363636',
    backgroundColor: '#363636',
  },
  checkboxSquareDisabled: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  checkmarkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  textContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#363636',
    lineHeight: 20,
  },
  checkboxLabelSelected: {
    color: '#363636',
    fontWeight: '700',
  },
  checkboxLabelDisabled: {
    color: '#999999',
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
  },
  checkboxDescriptionDisabled: {
    color: '#CCCCCC',
  },
  bottomRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
});

export default CheckboxGroup;
