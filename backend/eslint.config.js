
import js from "@eslint/js";
import globals from "globals";

export default [
  // Aplicar as regras recomendadas do ESLint
  js.configs.recommended,

  // Configurar o ambiente Node.js
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
