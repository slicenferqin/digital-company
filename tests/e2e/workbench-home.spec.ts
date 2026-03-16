import { expect, test } from "@playwright/test";

test("homepage workbench renders a real seeded team cycle", async ({ page, request }) => {
  const businessName = `Workbench E2E ${Date.now()}`;
  const response = await request.post("/api/teams/bootstrap", {
    data: {
      seedInitialCycle: true,
      mode: "manual",
      businessName,
      businessPositioning: "AI 销售自动化",
      brandVoice: "直接、克制、务实",
      targetAudience: "Founder-led B2B 团队负责人",
      coreOffer: "持续交付的数字内容增长团队",
      primaryChannels: ["公众号", "小红书"]
    }
  });

  expect(response.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page.getByTestId("workbench-team-name")).toContainText(businessName);
  await expect(page.getByTestId("workbench-cycle-card")).not.toContainText("暂无活跃周期");
  await expect(page.getByTestId("workbench-briefing-card")).not.toContainText("暂无简报");
  await expect(page.getByTestId("workbench-decision-card").first()).toContainText("pending");
  await expect(page.getByTestId("workbench-artifact-card").first()).toBeVisible();

  await page
    .getByTestId("workbench-decision-card")
    .first()
    .getByRole("button", { name: "批准" })
    .click();

  await expect(page.getByTestId("workbench-decision-card").first()).toContainText("暂无待决策事项");

  await page.getByTestId("advance-cycle-button").click();

  await expect(
    page.getByTestId("workbench-artifact-card").filter({ hasText: "渠道短帖包" }).first()
  ).toBeVisible();

  const secondCycleFeedback = "下一周期继续首段先给结论。";
  await page
    .getByPlaceholder("例如：下一周期继续首段先给结论，减少背景铺垫。")
    .first()
    .fill(secondCycleFeedback);

  await page.getByRole("button", { name: "采纳并启动下一周期" }).first().click();

  await expect(page.getByTestId("workbench-artifact-card").first()).toContainText(secondCycleFeedback);
});
