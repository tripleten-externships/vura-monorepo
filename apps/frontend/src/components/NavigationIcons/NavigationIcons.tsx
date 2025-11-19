import { View, TouchableOpacity, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '../../hooks/useNavigation';

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  onPress?: () => void;
}

export interface NavigationIconsProps {
  items: NavigationItem[];
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export default function NavigationIcons({
  items,
  containerStyle,
  labelStyle,
}: NavigationIconsProps) {
  const navigation = useNavigation();

  const handlePress = (item: NavigationItem) => {
    if (item.onPress) {
      item.onPress();
    } else {
      navigation.push(item.route);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {items.map((item) => {
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handlePress(item)}
            accessibilityLabel={`Navigate to ${item.route}`}
          >
            <Text style={[styles.label, labelStyle]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 72,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#363636',
    fontWeight: '600',
  },
});
