import { useCallback, useEffect, useState } from "react";
import { learningService } from "../services/learning.service";

export function useLearningAccess() {
  const [access, setAccess] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await learningService.getMyAccess();
      const currentTime = Date.now();
      const offset = new Date(result.serverTime).getTime() - currentTime;
      setAccess(result);
      setServerOffset(offset);
      setNow(currentTime + offset);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          requestError.message ||
          "Unable to load your package access",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now() + serverOffset);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [serverOffset]);

  return { access, now, isLoading, error, refresh };
}
