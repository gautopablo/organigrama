import { test, expect } from "@playwright/test";

test("flujo base de UI", async ({ page }) => {
  await page.goto("http://localhost:5173/organigrama");
  await expect(page.getByText("Vista Organigrama")).toBeVisible();
  await page.getByRole("link", { name: "Directorio" }).click();
  await expect(page.getByText("Directorio")).toBeVisible();
});
