// import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageBackground,
} from 'react-native';

// Import background images
import BG1 from '../../../assets/WelcomScreen-Frame1.svg';
import BG2 from '../../../assets/WelcomScreen-Frame2.svg';
import BG3 from '../../../assets/WelcomScreen-Frame3.svg';
// use react-router's navigation on the web

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // navigate to the questionnaire step route used by the web app
    navigate('/questionnaire/step-1');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        Vura helps you take better care of yourself and your parents
      </Text>

      <View style={styles.highlightContainer}>
        <View style={styles.highlight}>
          <ImageBackground
            source={{ uri: BG1 }}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 8 }}
          >
            <Text style={styles.highlightText}>Personalised care plan</Text>
          </ImageBackground>
        </View>
        <View style={styles.highlight}>
          <ImageBackground
            source={{ uri: BG2 }}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 8 }}
          >
            <Text style={styles.highlightText}>Trusted care resources</Text>
          </ImageBackground>
        </View>

        <View style={styles.highlight}>
          <ImageBackground
            source={{ uri: BG3 }}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 8 }}
          >
            <Text style={styles.highlightText}>Community with support</Text>
          </ImageBackground>
        </View>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={handleStart}>
        <Text style={styles.ctaText}>Start with a questionnaire</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 70,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    width: 360,
    height: 132,
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 60,
    color: '#333',
    fontFamily: 'Noto Serif',
    fontStyle: 'normal',
    letterSpacing: 34 * -0.01,
  },
  highlightContainer: {
    marginBottom: 73,
    width: 345,
    height: 365,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  highlightText: {
    fontSize: 18,
    color: '#444',
    flexShrink: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontStyle: 'normal',
    lineHeight: 18 * 1.2,
  },
  imageBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
    width: 345,
    height: 111,
  },

  ctaButton: {
    backgroundColor: '#363636',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: 345,
    height: 62,
    alignItems: 'center',
    marginTop: 57,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    lineHeight: 18 * 1.2,
  },
});

export default WelcomeScreen;
