// Jest transpiles with Babel rather than ts-loader so the test run does not
// need a second bundler. The preset list is spelled out here, with `babelrc`
// off, so tests use the automatic JSX runtime without changing `.babelrc` and
// the webpack build with it.
const babelOptions = {
    babelrc: false,
    configFile: false,
    presets: [
        ["@babel/preset-env", {targets: {node: "current"}}],
        ["@babel/preset-react", {runtime: "automatic"}],
        "@babel/preset-typescript",
    ],
};

/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src"],
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
    transform: {
        "^.+\\.[jt]sx?$": ["babel-jest", babelOptions],
    },
    // react-leaflet publishes ESM only, so it has to go through Babel too.
    transformIgnorePatterns: [
        "node_modules/(?!(\\.pnpm/)?(react-leaflet|@react-leaflet))",
    ],
    moduleNameMapper: {
        "\\.css$": "<rootDir>/tests/styleMock.js",
        "^@/(.*)$": "<rootDir>/$1",
    },
};
