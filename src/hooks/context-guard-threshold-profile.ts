export type ContextGuardProfile =
  | "conservative"
  | "conservative-plus"
  | "balanced"
  | "balanced-plus"
  | "aggressive"
  | "aggressive-plus"

export type ContextGuardThresholdOverrides = {
  one_million?: {
    l1_tokens?: number
    l2_tokens?: number
    l3_tokens?: number
  }
  four_hundred_k?: {
    l1_tokens?: number
    l2_tokens?: number
    l3_tokens?: number
  }
  two_hundred_k?: {
    l1_tokens?: number
    l2_tokens?: number
    l3_tokens?: number
  }
}

type ContextGuardPreset = {
  noticeRatio: number
  fuseRatio: number
  severeRatio: number
  oneMillion: {
    l1Tokens: number
    l2Tokens: number
    l3Tokens: number
    preemptiveEngineeringTokens: number
    preemptiveBioTokens: number
  }
  fourHundredK: {
    l1Tokens: number
    l2Tokens: number
    l3Tokens: number
    preemptiveEngineeringRatio: number
    preemptiveBioRatio: number
  }
  twoHundredK: {
    l1Tokens: number
    l2Tokens: number
    l3Tokens: number
    preemptiveEngineeringRatio: number
    preemptiveBioRatio: number
    keepRecentMessagesL1: number
    keepRecentMessagesL2: number
    keepRecentMessagesL3: number
  }
  defaultPreemptiveRatio: number
}

const PRESETS: Record<ContextGuardProfile, ContextGuardPreset> = {
  conservative: {
    noticeRatio: 0.50,
    fuseRatio: 0.66,
    severeRatio: 0.78,
    oneMillion: {
      l1Tokens: 260_000,
      l2Tokens: 380_000,
      l3Tokens: 620_000,
      preemptiveEngineeringTokens: 340_000,
      preemptiveBioTokens: 300_000,
    },
    fourHundredK: {
      l1Tokens: 170_000,
      l2Tokens: 245_000,
      l3Tokens: 330_000,
      preemptiveEngineeringRatio: 0.62,
      preemptiveBioRatio: 0.54,
    },
    twoHundredK: {
      l1Tokens: 100_000,
      l2Tokens: 130_000,
      l3Tokens: 145_000,
      preemptiveEngineeringRatio: 0.70,
      preemptiveBioRatio: 0.62,
      keepRecentMessagesL1: 110,
      keepRecentMessagesL2: 80,
      keepRecentMessagesL3: 50,
    },
    defaultPreemptiveRatio: 0.82,
  },
  balanced: {
    noticeRatio: 0.45,
    fuseRatio: 0.60,
    severeRatio: 0.72,
    oneMillion: {
      l1Tokens: 220_000,
      l2Tokens: 320_000,
      l3Tokens: 550_000,
      preemptiveEngineeringTokens: 300_000,
      preemptiveBioTokens: 260_000,
    },
    fourHundredK: {
      l1Tokens: 150_000,
      l2Tokens: 220_000,
      l3Tokens: 300_000,
      preemptiveEngineeringRatio: 0.58,
      preemptiveBioRatio: 0.50,
    },
    twoHundredK: {
      l1Tokens: 110_000,
      l2Tokens: 140_000,
      l3Tokens: 150_000,
      preemptiveEngineeringRatio: 0.65,
      preemptiveBioRatio: 0.58,
      keepRecentMessagesL1: 100,
      keepRecentMessagesL2: 70,
      keepRecentMessagesL3: 40,
    },
    defaultPreemptiveRatio: 0.78,
  },
  aggressive: {
    noticeRatio: 0.40,
    fuseRatio: 0.54,
    severeRatio: 0.66,
    oneMillion: {
      l1Tokens: 180_000,
      l2Tokens: 280_000,
      l3Tokens: 480_000,
      preemptiveEngineeringTokens: 250_000,
      preemptiveBioTokens: 220_000,
    },
    fourHundredK: {
      l1Tokens: 130_000,
      l2Tokens: 195_000,
      l3Tokens: 270_000,
      preemptiveEngineeringRatio: 0.52,
      preemptiveBioRatio: 0.46,
    },
    twoHundredK: {
      l1Tokens: 120_000,
      l2Tokens: 145_000,
      l3Tokens: 155_000,
      preemptiveEngineeringRatio: 0.60,
      preemptiveBioRatio: 0.52,
      keepRecentMessagesL1: 90,
      keepRecentMessagesL2: 60,
      keepRecentMessagesL3: 35,
    },
    defaultPreemptiveRatio: 0.72,
  },
  "conservative-plus": {
    noticeRatio: 0.50,
    fuseRatio: 0.66,
    severeRatio: 0.78,
    oneMillion: {
      l1Tokens: 290_000,
      l2Tokens: 410_000,
      l3Tokens: 650_000,
      preemptiveEngineeringTokens: 370_000,
      preemptiveBioTokens: 330_000,
    },
    fourHundredK: {
      l1Tokens: 200_000,
      l2Tokens: 275_000,
      l3Tokens: 360_000,
      preemptiveEngineeringRatio: 0.68,
      preemptiveBioRatio: 0.60,
    },
    twoHundredK: {
      l1Tokens: 130_000,
      l2Tokens: 160_000,
      l3Tokens: 175_000,
      preemptiveEngineeringRatio: 0.75,
      preemptiveBioRatio: 0.68,
      keepRecentMessagesL1: 110,
      keepRecentMessagesL2: 80,
      keepRecentMessagesL3: 50,
    },
    defaultPreemptiveRatio: 0.82,
  },
  "balanced-plus": {
    noticeRatio: 0.45,
    fuseRatio: 0.60,
    severeRatio: 0.72,
    oneMillion: {
      l1Tokens: 250_000,
      l2Tokens: 350_000,
      l3Tokens: 580_000,
      preemptiveEngineeringTokens: 330_000,
      preemptiveBioTokens: 290_000,
    },
    fourHundredK: {
      l1Tokens: 180_000,
      l2Tokens: 250_000,
      l3Tokens: 330_000,
      preemptiveEngineeringRatio: 0.64,
      preemptiveBioRatio: 0.56,
    },
    twoHundredK: {
      l1Tokens: 140_000,
      l2Tokens: 170_000,
      l3Tokens: 180_000,
      preemptiveEngineeringRatio: 0.70,
      preemptiveBioRatio: 0.64,
      keepRecentMessagesL1: 100,
      keepRecentMessagesL2: 70,
      keepRecentMessagesL3: 40,
    },
    defaultPreemptiveRatio: 0.78,
  },
  "aggressive-plus": {
    noticeRatio: 0.40,
    fuseRatio: 0.54,
    severeRatio: 0.66,
    oneMillion: {
      l1Tokens: 210_000,
      l2Tokens: 310_000,
      l3Tokens: 510_000,
      preemptiveEngineeringTokens: 280_000,
      preemptiveBioTokens: 250_000,
    },
    fourHundredK: {
      l1Tokens: 160_000,
      l2Tokens: 225_000,
      l3Tokens: 300_000,
      preemptiveEngineeringRatio: 0.58,
      preemptiveBioRatio: 0.52,
    },
    twoHundredK: {
      l1Tokens: 150_000,
      l2Tokens: 175_000,
      l3Tokens: 185_000,
      preemptiveEngineeringRatio: 0.66,
      preemptiveBioRatio: 0.58,
      keepRecentMessagesL1: 90,
      keepRecentMessagesL2: 60,
      keepRecentMessagesL3: 35,
    },
    defaultPreemptiveRatio: 0.72,
  },
}

export function resolveContextGuardProfile(
  rawProfile: string | undefined,
): ContextGuardProfile {
  if (
    rawProfile === "conservative" ||
    rawProfile === "conservative-plus" ||
    rawProfile === "balanced-plus" ||
    rawProfile === "aggressive" ||
    rawProfile === "aggressive-plus"
  ) {
    return rawProfile
  }
  return "balanced"
}

function applyThresholdOverrides(
  preset: ContextGuardPreset,
  overrides?: ContextGuardThresholdOverrides,
): ContextGuardPreset {
  if (!overrides) {
    return preset
  }

  return {
    ...preset,
    oneMillion: {
      ...preset.oneMillion,
      ...(overrides.one_million?.l1_tokens ? { l1Tokens: overrides.one_million.l1_tokens } : {}),
      ...(overrides.one_million?.l2_tokens ? { l2Tokens: overrides.one_million.l2_tokens } : {}),
      ...(overrides.one_million?.l3_tokens ? { l3Tokens: overrides.one_million.l3_tokens } : {}),
    },
    fourHundredK: {
      ...preset.fourHundredK,
      ...(overrides.four_hundred_k?.l1_tokens ? { l1Tokens: overrides.four_hundred_k.l1_tokens } : {}),
      ...(overrides.four_hundred_k?.l2_tokens ? { l2Tokens: overrides.four_hundred_k.l2_tokens } : {}),
      ...(overrides.four_hundred_k?.l3_tokens ? { l3Tokens: overrides.four_hundred_k.l3_tokens } : {}),
    },
    twoHundredK: {
      ...preset.twoHundredK,
      ...(overrides.two_hundred_k?.l1_tokens ? { l1Tokens: overrides.two_hundred_k.l1_tokens } : {}),
      ...(overrides.two_hundred_k?.l2_tokens ? { l2Tokens: overrides.two_hundred_k.l2_tokens } : {}),
      ...(overrides.two_hundred_k?.l3_tokens ? { l3Tokens: overrides.two_hundred_k.l3_tokens } : {}),
    },
  }
}

export function getContextGuardThresholdDisplay(args: {
  profile: ContextGuardProfile
  overrides?: ContextGuardThresholdOverrides
}): {
  oneMillion: { l1Tokens: number; l2Tokens: number; l3Tokens: number }
  fourHundredK: { l1Tokens: number; l2Tokens: number; l3Tokens: number }
  twoHundredK: { l1Tokens: number; l2Tokens: number; l3Tokens: number }
} {
  const preset = applyThresholdOverrides(PRESETS[args.profile], args.overrides)
  return {
    oneMillion: {
      l1Tokens: preset.oneMillion.l1Tokens,
      l2Tokens: preset.oneMillion.l2Tokens,
      l3Tokens: preset.oneMillion.l3Tokens,
    },
    fourHundredK: {
      l1Tokens: preset.fourHundredK.l1Tokens,
      l2Tokens: preset.fourHundredK.l2Tokens,
      l3Tokens: preset.fourHundredK.l3Tokens,
    },
    twoHundredK: {
      l1Tokens: preset.twoHundredK.l1Tokens,
      l2Tokens: preset.twoHundredK.l2Tokens,
      l3Tokens: preset.twoHundredK.l3Tokens,
    },
  }
}

export function getContextGuardNoticeLevel(args: {
  ratio: number
  totalTokens: number
  contextLimit: number
  profile: ContextGuardProfile
  overrides?: ContextGuardThresholdOverrides
}): 0 | 1 | 2 | 3 {
  const { ratio, totalTokens, contextLimit, profile, overrides } = args
  const preset = applyThresholdOverrides(PRESETS[profile], overrides)

  if (contextLimit >= 900_000) {
    if (totalTokens >= preset.oneMillion.l3Tokens || ratio >= preset.severeRatio) return 3
    if (totalTokens >= preset.oneMillion.l2Tokens || ratio >= preset.fuseRatio) return 2
    if (totalTokens >= preset.oneMillion.l1Tokens || ratio >= preset.noticeRatio) return 1
    return 0
  }

  if (contextLimit >= 350_000) {
    if (totalTokens >= preset.fourHundredK.l3Tokens || ratio >= preset.severeRatio) return 3
    if (totalTokens >= preset.fourHundredK.l2Tokens || ratio >= preset.fuseRatio) return 2
    if (totalTokens >= preset.fourHundredK.l1Tokens || ratio >= preset.noticeRatio) return 1
    return 0
  }

  if (contextLimit >= 180_000) {
    if (totalTokens >= preset.twoHundredK.l3Tokens || ratio >= preset.severeRatio) return 3
    if (totalTokens >= preset.twoHundredK.l2Tokens || ratio >= preset.fuseRatio) return 2
    if (totalTokens >= preset.twoHundredK.l1Tokens || ratio >= preset.noticeRatio) return 1
    return 0
  }

  if (ratio >= preset.severeRatio) return 3
  if (ratio >= preset.fuseRatio) return 2
  if (ratio >= preset.noticeRatio) return 1
  return 0
}

export function getContextGuardPreemptiveThreshold(args: {
  actualLimit: number
  isBioSession: boolean
  profile: ContextGuardProfile
  overrides?: ContextGuardThresholdOverrides
}): number {
  const { actualLimit, isBioSession, profile, overrides } = args
  const preset = applyThresholdOverrides(PRESETS[profile], overrides)

  if (actualLimit >= 900_000) {
    return (isBioSession
      ? preset.oneMillion.preemptiveBioTokens
      : preset.oneMillion.preemptiveEngineeringTokens) / actualLimit
  }

  if (actualLimit >= 350_000) {
    return isBioSession
      ? preset.fourHundredK.preemptiveBioRatio
      : preset.fourHundredK.preemptiveEngineeringRatio
  }

  if (actualLimit >= 180_000) {
    return isBioSession
      ? preset.twoHundredK.preemptiveBioRatio
      : preset.twoHundredK.preemptiveEngineeringRatio
  }

  return preset.defaultPreemptiveRatio
}
