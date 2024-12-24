import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

let frontendUrl = "https://google.com";

shortest.beforeAll(async ({ page }) => {
  await clerkSetup({
    frontendApiUrl: frontendUrl,
  });
  await page.goto(frontendUrl);
});

shortest('Find the wikipedia page of Lionel Messi');