import React from 'react';
import {
  ImageBackground,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ImageSourcePropType,
} from 'react-native';
import checkMark from '../../../assets/checkMark.png';
import { Emoji } from '../Emoji/Emoji';

interface CheckboxProps {
  label?: string; //Label for checkbox
  checked: boolean; //Check for checkbox
  onChange: (newValue: boolean) => void; //onChange event for checkbox
  resourceText?: string;
  onPressResource?: () => void;
  emojiIcon?: ImageSourcePropType | string;
}

function Checkbox({
  label,
  checked,
  onChange,
  resourceText,
  onPressResource,
  emojiIcon,
}: CheckboxProps) {
  return (
    <View style={[styles.container, checked && { backgroundColor: '#FFFFFF' }]}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange(!checked)} //Checks if its checked
        activeOpacity={0.8}
      >
        {checked ? (
          <ImageBackground
            source={checkMark as ImageSourcePropType} //Adds the checked image if checked
            style={[styles.checkbox, styles.checkMark]}
            imageStyle={{ borderRadius: 6 }}
          />
        ) : (
          <View style={styles.checkbox} />
        )}
        {/* label for checkbox */}
        <View style={styles.textContainer}>
          {label && (
            <View style={styles.labelRow}>
              <Text style={[styles.label, checked && styles.checkedLabel]}>{label}</Text>

              {emojiIcon && <Emoji emojiIcon={emojiIcon} isChecked={checked} />}
            </View>
          )}

          {resourceText && onPressResource && (
            <TouchableOpacity onPress={onPressResource} activeOpacity={0.7}>
              <Text style={styles.resourceText}>{resourceText}</Text>
            </TouchableOpacity>
          )}
        </View>
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
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flexDirection: 'column',
    flex: 1,
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
  checkedLabel: {
    color: 'rgba(54, 54, 54, 0.5)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceText: {
    marginTop: 10,
    marginLeft: -33,
    fontSize: 16,
    color: 'rgba(54, 54, 54, 0.5)',
  },
});
