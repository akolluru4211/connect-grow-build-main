import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPremium } from "@/hooks/useSubscription";

const DAILY_LIMIT = 2;
const STORAGE_KEY = "edworld-feature-trials";

interface TrialData {
  date: string;
  count: number;
}

export function useFeatureTrials(featureName: string) {
  const { user } = useAuth();
  const { isPremium, isLoading } = useIsPremium();
  const [trialsUsed, setTrialsUsed] = useState(0);

  const storageKey = `${STORAGE_KEY}-${featureName}-${user?.id || "anon"}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data: TrialData = JSON.parse(stored);
        const today = new Date().toISOString().split("T")[0];
        if (data.date === today) {
          setTrialsUsed(data.count);
        } else {
          localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
          setTrialsUsed(0);
        }
      } catch {
        setTrialsUsed(0);
      }
    }
  }, [storageKey]);

  const remaining = DAILY_LIMIT - trialsUsed;
  const canUse = isPremium || remaining > 0;

  const consumeTrial = () => {
    if (isPremium) return true;
    if (remaining <= 0) return false;

    const today = new Date().toISOString().split("T")[0];
    const newCount = trialsUsed + 1;
    localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
    setTrialsUsed(newCount);
    return true;
  };

  return {
    trialsUsed,
    remaining,
    canUse,
    consumeTrial,
    isPremium,
    isLoading,
    dailyLimit: DAILY_LIMIT,
  };
}
