// Validates the built HTML (dist/**/*.html) inside the test suite. html-validate
// is stricter than a browser, so a few rules that do not apply to this markup
// (inline SVG, the <noscript> fallback) are relaxed; the rest stays on.
export default {
  extends: ["html-validate:recommended"],
  rules: {
    "no-inline-style": "off",
    "attribute-boolean-style": "off",
    // Vite emits self-closing void tags; both styles are valid HTML5.
    "void-style": "off",
    "prefer-native-element": "off",
    // The lowercase doctype is deliberate and valid; enforce it consistently.
    "doctype-style": ["error", { style: "lowercase" }],
    "wcag/h32": "off",
    "wcag/h63": "off",
  },
};
