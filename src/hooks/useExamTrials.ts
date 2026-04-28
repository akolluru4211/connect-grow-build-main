export function useExamTrials() {
  return {
    trialsUsed: 0,
    remaining: Infinity,
    canUse: true,
    consumeTrial: () => true,
    isPremium: true,
    dailyLimit: Infinity,
  };
}
