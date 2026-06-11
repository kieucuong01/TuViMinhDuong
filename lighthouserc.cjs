module.exports = {
  ci: {
    collect: {
      url: [
        "https://lasotinhhoa.vn/",
        "https://lasotinhhoa.vn/kien-thuc-tu-vi",
        "https://lasotinhhoa.vn/xem-ngay",
      ],
      numberOfRuns: 1,
      settings: {
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:performance": ["warn", { minScore: 0.5 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
