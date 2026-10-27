import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import { profileService } from "../services/profile.service";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const { updateUser } = useAuthContext();

  const getErrorMessage = (err, fallback) => {
    const apiError = err.response?.data?.error;
    const details = Array.isArray(apiError?.details)
      ? apiError.details
          .map((detail) =>
            detail?.field && detail?.message
              ? `${detail.field}: ${detail.message}`
              : detail?.message
          )
          .filter(Boolean)
      : [];

    return [apiError?.message || err.message || fallback, ...details].join(" ");
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load profile"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (payload) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
      updateUser(updated);
      return updated;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update profile"));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    isLoading,
    isSaving,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}