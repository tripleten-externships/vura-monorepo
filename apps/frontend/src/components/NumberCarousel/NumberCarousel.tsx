import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface NumberCarouselProps {
  minValue: number;
  maxValue: number;
  selectedValue: number | null;
  onValueChange: (value: number) => void;
  title?: string;
  errorMessage?: string;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 111; // Fixed height as requested
const VISIBLE_ITEMS = 3; // Display 3 items with selected item in center
const ITEM_SPACING = 8; // 8px vertical spacing between items
const ITEM_HEIGHT = (CAROUSEL_HEIGHT - ITEM_SPACING * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS; // Calculate height minus spacing

export const NumberCarousel: React.FC<NumberCarouselProps> = ({
  minValue,
  maxValue,
  selectedValue,
  onValueChange,
  title,
  errorMessage,
  step = 1,
  suffix = '',
  disabled = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const isInitializing = useRef(true);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const [currentScrollY, setCurrentScrollY] = React.useState(0);

  // Generate array of values
  const values = React.useMemo(() => {
    const result: number[] = [];
    for (let i = minValue; i <= maxValue; i += step) {
      result.push(i);
    }
    return result;
  }, [minValue, maxValue, step]);

  // Calculate scroll position to center a specific value
  const getScrollPosition = useCallback(
    (value: number): number => {
      const valueIndex = values.indexOf(value);
      if (valueIndex === -1) return 0;

      // To center an item at valueIndex, we need to scroll by:
      // valueIndex * (ITEM_HEIGHT + ITEM_SPACING)
      // This positions the item at the center of the visible area
      return Math.max(0, valueIndex * (ITEM_HEIGHT + ITEM_SPACING));
    },
    [values]
  );

  // Initialize with first value (lowest number) if no selection
  useEffect(() => {
    if (selectedValue === null && values.length > 0) {
      const timer = setTimeout(() => {
        try {
          const defaultValue = values[0]; // Start with first/lowest value (50)
          onValueChange(defaultValue);
        } catch (error) {
          console.warn('Failed to initialize default value:', error);
        }
      }, 100); // Small delay to ensure store is initialized

      return () => clearTimeout(timer);
    }
  }, [selectedValue, values, onValueChange]);

  // Scroll to initial value only during initialization
  useEffect(() => {
    if (
      selectedValue !== null &&
      scrollViewRef.current &&
      !isScrolling.current &&
      isInitializing.current
    ) {
      const scrollPosition = getScrollPosition(selectedValue);
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: false,
      });
      // Mark initialization as complete after first scroll
      isInitializing.current = false;
    }
  }, [selectedValue, getScrollPosition]);

  // Handle scroll events - dynamically select center item
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (disabled) return;

      const scrollY = event.nativeEvent.contentOffset.y;
      setCurrentScrollY(scrollY);

      // Calculate which item is closest to the center (accounting for spacing)
      const paddingItems = Math.floor(VISIBLE_ITEMS / 2);
      const centerOffset = paddingItems * (ITEM_HEIGHT + ITEM_SPACING);
      const adjustedScrollY = scrollY + centerOffset;
      const centerItemIndex = Math.round(adjustedScrollY / (ITEM_HEIGHT + ITEM_SPACING));

      // Convert to actual value index (accounting for padding)
      const actualIndex = centerItemIndex - paddingItems;

      // Update selection if within valid bounds
      if (actualIndex >= 0 && actualIndex < values.length) {
        const centerValue = values[actualIndex];
        if (centerValue !== selectedValue) {
          onValueChange(centerValue);
        }
      }
    },
    [disabled, values, selectedValue, onValueChange]
  );

  // Handle scroll end - just mark that scrolling has stopped
  const handleScrollEnd = useCallback(() => {
    isScrolling.current = false;
  }, []);

  // Handle scroll begin
  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
    isInitializing.current = false; // User is actively scrolling, so initialization is complete
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }
  }, []);

  // Handle momentum scroll end - just mark scroll as complete
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollTimer.current = setTimeout(() => handleScrollEnd(), 50);
    },
    [handleScrollEnd]
  );

  // Handle direct value selection
  const handleValuePress = useCallback(
    (value: number) => {
      if (disabled) return;

      onValueChange(value);
      const scrollPosition = getScrollPosition(value);
      scrollViewRef.current?.scrollTo({
        y: scrollPosition,
        animated: true,
      });
    },
    [onValueChange, getScrollPosition, disabled]
  );

  // Render individual number item with dynamic center-based styling
  const renderItem = useCallback(
    (value: number, index: number) => {
      // Calculate the visual center position (middle of visible items)
      const centerIndex = Math.floor(VISIBLE_ITEMS / 2);
      const paddingItems = centerIndex;

      // Calculate distance from the visual center of the carousel for 3D effects
      const distanceFromVisualCenter = Math.abs(index - paddingItems);

      // Calculate selection strength based on distance from center for 3D effects
      const maxDistance = 2;
      const normalizedDistance = Math.min(distanceFromVisualCenter, maxDistance) / maxDistance;

      // 3D effect strength based on distance from visual center
      const selectionStrength = Math.max(0, 1 - normalizedDistance);

      // Selection is based on actual selectedValue (which follows center position)
      const isSelected = value === selectedValue;
      const isAtVisualCenter = distanceFromVisualCenter === 0;

      // Rolling pin effect: perspective rotation based on distance from center
      const rotationAngle = normalizedDistance * 12; // Rotate up to 12 degrees
      const perspective = 1000;

      // Scale effect: items further away appear smaller due to perspective
      const scale = 1 - normalizedDistance * 0.08; // Reduce size by up to 8%

      // Dynamic opacity based on selection and distance from center
      // Selected item gets full opacity, others fade based on distance
      let opacity = 0.5; // Base opacity for non-selected items
      if (isSelected) {
        opacity = 1.0; // Selected item is fully opaque
      } else {
        // Non-selected items fade based on distance from center
        opacity = 0.5 + selectionStrength * 0.3; // Range from 0.5 to 0.8
      }

      // Fixed font size of 24px for all items
      const fontSize = 24;
      const fontWeight = isSelected ? '700' : '400';

      // Determine rotation direction based on position relative to center
      const rotateX = index > paddingItems ? rotationAngle : -rotationAngle;

      // Create transform style for rolling pin effect
      const cylindricalTransform = {
        transform: [
          { perspective },
          { rotateX: `${rotateX}deg` },
          { scaleX: scale },
          { scaleY: scale },
        ],
        opacity: opacity,
      };

      // Dynamic text style based on selection strength
      const dynamicTextStyle = {
        fontSize,
        fontWeight,
        color: '#363636',
      };

      return (
        <View key={value} style={styles.itemContainer}>
          <TouchableOpacity
            style={[
              styles.item,
              isSelected && styles.selectedItem,
              disabled && styles.disabledItem,
              cylindricalTransform,
            ]}
            onPress={disabled ? undefined : () => handleValuePress(value)}
            activeOpacity={disabled ? 1 : 0.7}
            accessibilityRole="button"
            accessibilityLabel={`Select ${value}${suffix}`}
            accessibilityState={{ selected: isSelected, disabled }}
          >
            <Text style={[styles.itemText, dynamicTextStyle, disabled && styles.disabledItemText]}>
              {value}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [suffix, disabled, handleValuePress, values, currentScrollY, selectedValue]
  );

  // Add padding items for proper centering
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);
  const paddedValues = [
    ...new Array(paddingItems).fill(null),
    ...values,
    ...new Array(paddingItems).fill(null),
  ];

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.carouselContainer}>
        {/* Selection indicator overlay */}
        <View style={styles.selectionOverlay}>
          <View style={styles.selectionIndicator} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="normal"
          scrollEnabled={!disabled}
          bounces={false}
        >
          {paddedValues.map((value, index) => {
            if (value === null) {
              return (
                <View key={`padding-${index}`} style={styles.itemContainer}>
                  <View style={styles.item} />
                </View>
              );
            }
            return renderItem(value, index);
          })}
        </ScrollView>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: '#363636',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: -0.34, // -1% of 34px = -0.34
    lineHeight: 44,
    fontFamily: 'Noto Serif',
    width: 317,
    height: 88,
    alignSelf: 'center',
  },
  carouselContainer: {
    height: CAROUSEL_HEIGHT,
    position: 'relative',
    backgroundColor: '#F6F4FA',
    borderRadius: 28,
    overflow: 'hidden',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  selectionIndicator: {
    width: '90%',
    height: ITEM_HEIGHT,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  itemContainer: {
    marginBottom: ITEM_SPACING,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectedItem: {
    // Selection is handled by overlay
  },
  disabledItem: {
    opacity: 0.5,
  },
  itemText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '400',
  },
  selectedItemText: {
    fontSize: 20,
    color: '#363636',
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  disabledItemText: {
    color: '#CCCCCC',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NumberCarousel;
