/**
 * Questionnaire Theme Configuration
 * Customize these values to match your design system
 */

export interface QuestionnaireTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    border: {
      default: string;
      focused: string;
      error: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  layout: {
    progressBar: {
      height: number;
      trackColor: string;
      fillColor: string;
    };
    buttons: {
      height: number;
      minWidth: number;
    };
    inputs: {
      height: number;
      padding: number;
    };
  };
}

// Default theme - customize these values
export const defaultTheme: QuestionnaireTheme = {
  colors: {
    primary: '#363636',
    secondary: '#F6F4FA',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: {
      primary: '#2C2C2E',
      secondary: '#666666',
      disabled: '#CCCCCC',
      inverse: '#FFFFFF',
    },
    border: {
      default: '#E7E7E7',
      focused: '#363636',
      error: '#FF4444',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  layout: {
    progressBar: {
      height: 6,
      trackColor: '#E5E5E5',
      fillColor: '#363636',
    },
    buttons: {
      height: 48,
      minWidth: 100,
    },
    inputs: {
      height: 56,
      padding: 16,
    },
  },
};

// Alternative themes you can switch between
export const modernTheme: QuestionnaireTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#6366F1',
    secondary: '#F1F5F9',
  },
  borderRadius: {
    ...defaultTheme.borderRadius,
    md: 12,
    lg: 16,
    xl: 20,
  },
};

export const minimalTheme: QuestionnaireTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#000000',
    secondary: '#F9FAFB',
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    full: 9999,
  },
};
