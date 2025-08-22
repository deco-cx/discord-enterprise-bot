module.exports = {
  // Estilo básico
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // Quebras de linha
  endOfLine: 'lf',
  
  // Objetos e arrays
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Funções arrow
  arrowParens: 'avoid',
  
  // Formatação específica para diferentes tipos de arquivo
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
