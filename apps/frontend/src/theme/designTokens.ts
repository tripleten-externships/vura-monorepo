export const colors = {
  base: '#FFFFFF',
  textPrimary: '#363636',
  textSecondary: 'rgba(54,54,54,0.5)',
  surface: '#F6F4FA',
  stroke: '#E7E7E7',
  cta: '#363636',
  danger: '#F12D2D',
};

export const radii = {
  input: 20,
  card: 20,
  cardLg: 24,
  button: 20,
  avatar: 50, // used for 100x100 avatar circle
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const typography = {
  headingSerif: {
    fontFamily: 'Noto Serif',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  body16Regular: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
  },
  body16Medium: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  body18Medium: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500' as const,
  },
};
