// SparkleShare-inspired design system
export const colors = {
  // Primary SparkleShare color palette
  primary: {
    blue: '#3498db',
    darkBlue: '#2980b9', 
    teal: '#16a085',
    gray: '#95a5a6',
    lightGray: '#ecf0f1',
    darkGray: '#34495e'
  },
  // Status colors
  status: {
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db'
  },
  // Semantic colors
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    accent: '#ecf0f1'
  },
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    muted: '#95a5a6'
  }
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem'  // 64px
};

export const borderRadius = {
  sm: '4px',
  md: '8px', 
  lg: '12px',
  xl: '16px',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem', 
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};