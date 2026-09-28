module.exports = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.(t|j)sx?$": "babel-jest" },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: { "\\.(css)$": "identity-obj-proxy" },
};
