import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
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
          <Image source={{ uri: '../../../assets/' }} style={styles.icon} resizeMode="contain" />
          <Text style={styles.highlightText}>Personalised care plan</Text>
        </View>

        <View style={styles.highlight}>
          <Image source={{ uri: 'YOUR_IMAGE_URL_2' }} style={styles.icon} resizeMode="contain" />
          <Text style={styles.highlightText}>Trusted care resources</Text>
        </View>

        <View style={styles.highlight}>
          <Image source={{ uri: 'YOUR_IMAGE_URL_3' }} style={styles.icon} resizeMode="contain" />
          <Text style={styles.highlightText}>Community with support</Text>
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
    paddingVertical: 40,
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
    marginBottom: 32,
    color: '#333',
    fontFamily: 'Noto Serif',
    fontStyle: 'normal',
    letterSpacing: 34 * -0.01,
  },
  highlightContainer: {
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    //  textAlign: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    marginRight: 16,
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
  ctaButton: {
    backgroundColor: '#363636',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
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
