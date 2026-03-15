import { expect, test } from "@playwright/test";

test("phase0 persistent team demo path completes owner flow", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("start-phase0-demo").click();

  await expect(page.getByTestId("demo-team-card")).toContainText("团队已创建");
  await expect(page.getByTestId("demo-cycle-card")).toContainText("周期已启动");
  await expect(page.getByTestId("demo-briefing-card")).toContainText("秘书长简报");
  await expect(page.getByTestId("demo-artifact-card")).toContainText("研究 / 交付资产");
  await expect(page.getByTestId("demo-decision-card")).toContainText("pending");
  await expect(page.getByTestId("demo-resume-card")).toContainText("等待老板批准后恢复");

  await page.getByTestId("approve-phase0-decision").click();

  await expect(page.getByTestId("demo-decision-card")).toContainText("approved");
  await expect(page.getByTestId("demo-resume-card")).toContainText("工作流已从 checkpoint 恢复");
});
