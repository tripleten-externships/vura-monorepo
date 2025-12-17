import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/StoreContext';
import { OnboardingQuestionnaire } from '../components/OnboardingQuestionnaire';

/**
 * MOBILE QUESTIONNAIRE DEMO
 *
 * Full-screen iPhone app layout matching Figma design exactly
 */
const MobileQuestionnaireDemo: React.FC = observer(() => {
  const { onboardingStore } = useStore();

  return (
    <View style={styles.demoWrapper}>
      <View style={styles.mobileContainer}>
        {/* iPhone status bar - using SVG icons from Figma */}
        <View style={styles.statusBar}>
          {/* Left side - Time */}
          <View style={styles.statusLeft}>
            <Text style={styles.statusTime}>9:41</Text>
          </View>

          {/* Center - iPhone Notch */}
          <View style={styles.notchContainer}>
            <Image
              source={{ uri: '/assets/The%20notch.png' }}
              style={styles.notchIcon}
              resizeMode="contain"
            />
          </View>

          {/* Right side - Status Icons */}
          <View style={styles.statusRight}>
            {/* Signal/Carrier Icon - Replace with your Figma SVG */}
            <Image
              source={{ uri: '/assets/Cellular Connection.png' }}
              style={styles.signalIcon}
              resizeMode="contain"
            />

            {/* WiFi Icon - Replace with your Figma SVG */}
            <Image
              source={{ uri: '/assets/WiFi.png' }}
              style={styles.wifiIcon}
              resizeMode="contain"
            />

            {/* Battery Icon - Replace with your Figma SVG */}
            <Image
              source={{ uri: '/assets/Battery.png' }}
              style={styles.batteryIconImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* App header with back button and step counter */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onboardingStore.currentStep === 1) {
                // Go back to welcome screen - you can customize this navigation
                console.log('Navigate back to welcome screen');
                // Example: navigate('/welcome') or similar
              } else {
                onboardingStore.previousStep();
              }
            }}
          >
            <Image
              source={{ uri: '/assets/chevron-back.svg' }}
              style={styles.backChevronIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.centerCounter}>
            <Text style={styles.stepCounter}>
              {onboardingStore.currentStep}/{onboardingStore.totalSteps}
            </Text>
          </View>
        </View>

        {/* Main content area - full screen */}
        <View style={styles.contentArea}>
          <OnboardingQuestionnaire />
        </View>

        {/* iPhone home indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  demoWrapper: {
    flex: 1,
    backgroundColor: '#f4f1f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  mobileContainer: {
    width: 393,
    height: 852,
    backgroundColor: '#FFFFFF',
    borderRadius: 56,
    overflow: 'hidden', // This ensures content respects the border radius
  },

  statusBar: {
    height: 50,
    position: 'relative', // Enable absolute positioning for children
    backgroundColor: '#FFFFFF',
  },

  statusLeft: {
    position: 'absolute',
    left: 54,
    top: 18.38,
  },

  statusTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
    fontFamily: 'SF Compact Display',
    lineHeight: 21,
  },

  notchContainer: {
    position: 'absolute',
    left: '50%',
    top: 11.5, // Adjust this to match your Figma notch top value
    transform: [{ translateX: -62.5 }], // Center the 125px wide notch
    alignItems: 'center',
    justifyContent: 'center',
  },

  notchIcon: {
    width: 125,
    height: 37,
  },

  statusRight: {
    position: 'absolute',
    right: 32.67, // Adjust this to match your Figma right margin
    top: 23, // Adjust this to match your Figma status icons top value
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  // Status bar icon containers - adjust sizes to match your Figma SVGs
  signalIcon: {
    width: 19.2,
    height: 12.23,
  },

  wifiIcon: {
    width: 17.14,
    height: 12.33,
  },

  batteryIconImg: {
    width: 27.33,
    height: 13,
  },

  topHeader: {
    height: 60,
    position: 'relative', // Enable absolute positioning for children
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    position: 'absolute',
    left: 24,
    top: 20, // Adjusted for better alignment
    width: 24, // Made larger for better touch target
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backChevronIcon: {
    width: 6,
    height: 12,
    tintColor: '#363636',
  },

  centerCounter: {
    position: 'absolute',
    left: 186,
    top: 21,
    alignItems: 'center',
  },

  stepCounter: {
    fontSize: 14,
    color: '#363636',
    fontWeight: '500',
    lineHeight: 17,
    opacity: 0.5,
  },

  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
    opacity: 0.3,
  },
});

export default MobileQuestionnaireDemo;
