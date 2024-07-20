import globals from 'globals';

export default [
  {
    languageOptions: { globals: globals.browser },
    rules: {
      // Enforce 4 spaces for indentation
      'indent': ['error', 4],
      
      // Enforce the use of single quotes
      'quotes': ['error', 'single'],
      
      // Enforce the use of semicolons at the end of statements
      'semi': ['error', 'always'],
      
      // Example of another rule: no unused variables
      'no-unused-vars': ['warn'],
    }
  },
];
