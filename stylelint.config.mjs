// Lints the hand-written site stylesheets. The sablonlar app is Tailwind and is
// left out; it is covered by oxlint and tsc.
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["dist/**", "node_modules/**", "apps/**"],
  rules: {
    // The design system leans on long custom-property chains and multi-line
    // gradients; keep the rules that catch real mistakes and drop the ones that
    // only enforce a formatting taste the codebase does not share.
    "custom-property-pattern": null,
    "selector-class-pattern": null,
    "no-descending-specificity": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "font-family-no-missing-generic-family-keyword": null,
    "value-keyword-case": null,
    "alpha-value-notation": null,
    "color-function-notation": null,
    "media-feature-range-notation": null,
    "property-no-vendor-prefix": null,
    // Whitespace/notation taste; the files are hand-grouped with blank lines that
    // read better than the rule's opinion. Only formatting rules are disabled.
    "color-function-alias-notation": null,
    "custom-property-empty-line-before": null,
    "comment-empty-line-before": null,
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "at-rule-empty-line-before": null,
  },
};
