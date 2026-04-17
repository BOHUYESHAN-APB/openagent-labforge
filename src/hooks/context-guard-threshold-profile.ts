export type ContextGuardProfile = "conservative" | "balanced" | "aggressive"

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
    defaultPreemptiveRatio: 0.72,
  },
}

export function resolveContextGuardProfile(
  rawProfile: string | undefined,
): ContextGuardProfile {
  if (rawProfile === "conservative" || rawProfile === "aggressive") {
    return rawProfile
  }
  return "balanced"
}

export function getContextGuardNoticeLevel(args: {
  ratio: number
  totalTokens: number
  contextLimit: number
  profile: ContextGuardProfile
}): 0 | 1 | 2 | 3 {
  const { ratio, totalTokens, contextLimit, profile } = args
  const preset = PRESETS[profile]

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

  if (ratio >= preset.severeRatio) return 3
  if (ratio >= preset.fuseRatio) return 2
  if (ratio >= preset.noticeRatio) return 1
  return 0
}

export function getContextGuardPreemptiveThreshold(args: {
  actualLimit: number
  isBioSession: boolean
  profile: ContextGuardProfile
}): number {
  const { actualLimit, isBioSession, profile } = args
  const preset = PRESETS[profile]

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

  return preset.defaultPreemptiveRatio
}
