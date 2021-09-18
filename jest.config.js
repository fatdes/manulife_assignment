/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: "coverage",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$"
};