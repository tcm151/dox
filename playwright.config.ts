import { defineConfig, devices } from "@playwright/test"
import { join } from "node:path"

const baseURL = process.env.CLASSICFORUM_TEST_SERVER_URL
const testDataDirectory = process.env.CLASSICFORUM_TEST_DATA_DIRECTORY
const reportPath = process.env.CLASSICFORUM_TEST_REPORT_PATH
if (!baseURL) {
    throw new Error("Run browser integration tests with `yarn --silent test` to start the isolated test app.")
}
if (!testDataDirectory || !reportPath) {
    throw new Error("Run browser integration tests with `yarn --silent test` to configure isolated test output.")
}

export default defineConfig({
    testDir: "./tests/parallel",
    testMatch: ["**/*.browser.test.ts", "**/*.integration.test.ts"],
    outputDir: join(testDataDirectory, "browser-results"),
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    workers: 2,
    reporter: [["dot"], ["json", { outputFile: reportPath }]],
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
})