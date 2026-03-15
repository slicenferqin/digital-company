import type { CyclePlanningState, CyclePlanDraft, PlannedProjectDraft } from "../state";

function buildProjectDrafts(
  priorityFocus: string,
  memoryTitles: string[],
  writingGuidelines: string[],
  needsPreferenceCalibration: boolean
): PlannedProjectDraft[] {
  const memoryHint =
    memoryTitles.length > 0 ? `吸收历史反馈：${memoryTitles.slice(0, 2).join("、")}` : "吸收已有团队经验";

  const drafts: PlannedProjectDraft[] = [
    {
      type: "strategy",
      title: `制定 ${priorityFocus} 的周期策略`,
      goal: `明确本周期围绕 ${priorityFocus} 的内容主线、渠道重点与审核标准。`,
      priority: 100,
      tasks: [
        {
          taskType: "strategy_card",
          title: "整理本周期内容策略卡",
          priority: 100,
          requiresOwnerApproval: true
        }
      ]
    },
    {
      type: "writing",
      title: `产出 ${priorityFocus} 的核心内容资产`,
      goal: `形成一篇长文初稿与若干可扩展选题，为后续分发提供主资产。`,
      priority: 90,
      tasks: [
        {
          taskType: "topic_brief",
          title: "生成 3 个高优先级选题 brief",
          priority: 90,
          requiresOwnerApproval: false
        },
        {
          taskType: "article_draft",
          title: "完成 1 篇旗舰长文初稿",
          priority: 95,
          requiresOwnerApproval: false,
          inputContext: {
            writingGuidelines
          }
        }
      ]
    },
    {
      type: "distribution",
      title: "准备渠道分发与经营复盘材料",
      goal: `围绕主资产生成分发内容，并沉淀老板可消费的简报与复盘线索。`,
      priority: 80,
      tasks: [
        {
          taskType: "social_post_pack",
          title: "生成 3 条渠道适配短内容",
          priority: 80,
          requiresOwnerApproval: false
        },
        {
          taskType: "cycle_briefing",
          title: memoryHint,
          priority: 70,
          requiresOwnerApproval: false
        }
      ]
    }
  ];

  if (needsPreferenceCalibration) {
    drafts.push({
      type: "editing",
      title: "根据老板偏好校准写作与审核规则",
      goal: "把稳定反馈转成明确的写作规则与编辑审核门，减少下一轮返工。",
      priority: 85,
      tasks: [
        {
          taskType: "preference_calibration",
          title: "将老板稳定偏好写入写作规则与审核清单",
          priority: 85,
          requiresOwnerApproval: false,
          inputContext: {
            writingGuidelines
          }
        }
      ]
    });
  }

  return drafts;
}

export async function generateCyclePlan(state: CyclePlanningState) {
  if (!state.team) {
    throw new Error("Team context must be loaded before generating cycle plan");
  }

  const priorityFocus =
    state.requestedPriorityFocus ??
    state.team.coreOffer ??
    state.team.businessPositioning ??
    state.team.businessName;
  const goalSummary =
    state.requestedGoalSummary ??
    `围绕 ${priorityFocus} 连续产出一批可审核、可复用、可持续优化的内容资产。`;
  const memoryTitles = state.memoryInputs.map((item) => item.title);
  const activeOwnerPreferences = state.preferenceProfiles.filter(
    (profile) => profile.profileType === "owner" && profile.active
  );
  const writingGuidelines = activeOwnerPreferences.flatMap((profile) => {
    const prefs = profile.preferences as Record<string, unknown>;
    const note = typeof prefs.note === "string" ? prefs.note : null;
    const hints = Array.isArray(prefs.editBehaviorHints)
      ? prefs.editBehaviorHints.filter((hint): hint is string => typeof hint === "string")
      : [];
    return [...(note ? [note] : []), ...hints];
  });

  const cyclePlan: CyclePlanDraft = {
    cycleType: state.requestedCycleType ?? "weekly",
    goalSummary,
    priorityFocus,
    rationale: [
      `以 ${priorityFocus} 作为本周期重点主题`,
      `优先把交付物做成可审核资产，而不是停留在过程`,
      memoryTitles.length > 0 ? `已吸收记忆输入：${memoryTitles.slice(0, 3).join("、")}` : "当前无历史记忆输入，按默认 founding team 节奏推进",
      writingGuidelines.length > 0
        ? `已把老板稳定偏好转成下周期写作规则：${writingGuidelines.join("、")}`
        : "当前没有稳定 owner preference 影响计划结构"
    ],
    projects: buildProjectDrafts(
      priorityFocus,
      memoryTitles,
      writingGuidelines,
      writingGuidelines.length > 0
    )
  };

  return {
    cyclePlan
  };
}
