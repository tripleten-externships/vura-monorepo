import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageProps,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { useNavigation } from '../../hooks/useNavigation';

export interface NavigationItem {
  id: string;
  icon: { uri: string };
  route: string;
  onPress?: () => void;
}

export interface NavigationIconsProps {
  items: NavigationItem[];
  containerStyle?: ViewStyle;
  iconStyle?: ImageStyle;
  iconSize?: number;
}

export default function NavigationIcons({
  items,
  containerStyle,
  iconStyle,
  iconSize = 24,
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
        const imageSource = typeof item.icon === 'string' ? { uri: item.icon } : item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handlePress(item)}
            accessibilityLabel={`Navigate to ${item.route}`}
          >
            <Image
              source={imageSource}
              style={[styles.icon, { width: iconSize, height: iconSize }, iconStyle]}
              resizeMode="contain"
            />
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
  icon: {
    width: 24,
    height: 24,
  },
});
