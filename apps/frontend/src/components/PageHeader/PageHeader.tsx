import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type HeaderIconProps = {
  icon: React.ReactNode;
  onPress?: () => void;
};

type PageHeaderProps = {
  title: string;
  leftIcon?: HeaderIconProps;
  rightIcon?: HeaderIconProps;
  containerStyle?: object;
  titleStyle?: object;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  containerStyle,
  titleStyle,
}) => {
  const renderIcon = (config?: HeaderIconProps) => {
    if (!config) return <View style={styles.iconPlaceholder} />;
    return (
      <Pressable
        onPress={config.onPress}
        style={({ pressed }) => [
          styles.iconPlaceholder,
          config.onPress && pressed ? styles.iconPressed : undefined,
        ]}
      >
        {config.icon}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderIcon(leftIcon)}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {renderIcon(rightIcon)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#111',
    textAlign: 'center',
    fontFamily: 'Noto Serif',
    flex: 1,
  },
});
