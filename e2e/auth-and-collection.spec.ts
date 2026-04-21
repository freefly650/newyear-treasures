import { test, expect } from "@playwright/test";

/**
 * E2E: Login with test user then load the collection page.
 * Requires the dev server to be running (npm run dev) and a test user to exist.
 * Set TEST_USER_EMAIL and TEST_USER_PASSWORD in the environment (e.g. in .env.test or export before running).
 */
test.describe("Auth and collection", () => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  test.beforeEach(async ({ page }) => {
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/");
  });

  test("login then see collection or empty state", async ({ page }) => {
    if (!email || !password) return;

    // Redirected to login when not authenticated
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // After login, should land on home (collection)
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Page shows collection: empty state text or doll count or add button
    await expect(
      page.getByText(/your collection|toys in your collection|add a doll/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
