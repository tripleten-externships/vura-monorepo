import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * VISUAL DEBUGGING HELPER
 *
 * This component helps you identify different parts of the questionnaire
 * by adding colored borders and labels to each section.
 *
 * Usage: Wrap any component with <DebugBorder> to see its boundaries
 */

interface DebugBorderProps {
  children: React.ReactNode;
  label: string;
  color?: string;
  showLabel?: boolean;
}

export const DebugBorder: React.FC<DebugBorderProps> = ({
  children,
  label,
  color = '#FF0000',
  showLabel = true,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  return (
    <View style={[styles.debugContainer, { borderColor: color }]}>
      {showLabel && isVisible && (
        <TouchableOpacity
          style={[styles.debugLabel, { backgroundColor: color }]}
          onPress={() => setIsVisible(!isVisible)}
        >
          <Text style={styles.debugLabelText}>{label}</Text>
        </TouchableOpacity>
      )}
      {children}
    </View>
  );
};

/**
 * PRE-CONFIGURED DEBUG WRAPPERS
 *
 * Use these to quickly identify different parts of your questionnaire
 */

export const DebugHeader = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="HEADER SECTION" color="#FF6B6B">
    {children}
  </DebugBorder>
);

export const DebugProgress = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="PROGRESS INDICATOR" color="#4ECDC4">
    {children}
  </DebugBorder>
);

export const DebugStepContent = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="STEP CONTENT AREA" color="#45B7D1">
    {children}
  </DebugBorder>
);

export const DebugNavigation = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="NAVIGATION BUTTONS" color="#F9CA24">
    {children}
  </DebugBorder>
);

export const DebugRadioGroup = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="RADIO GROUP (Single Choice)" color="#6C5CE7">
    {children}
  </DebugBorder>
);

export const DebugCheckboxGroup = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="CHECKBOX GROUP (Multiple Choice)" color="#A29BFE">
    {children}
  </DebugBorder>
);

export const DebugNumberCarousel = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="NUMBER CAROUSEL (Age Picker)" color="#FD79A8">
    {children}
  </DebugBorder>
);

export const DebugTextInput = ({ children }: { children: React.ReactNode }) => (
  <DebugBorder label="TEXT INPUT FIELD" color="#FDCB6E">
    {children}
  </DebugBorder>
);

const styles = StyleSheet.create({
  debugContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'relative',
  },
  debugLabel: {
    position: 'absolute',
    top: -12,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
