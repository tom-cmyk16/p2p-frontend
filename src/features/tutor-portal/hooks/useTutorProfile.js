import { useCallback, useEffect, useState } from "react";
import { tutorProfileService } from "../services/tutorProfile.service";

const getErrorMessage = (error, fallback) => {
  const apiError = error.response?.data?.error;
  const details = Array.isArray(apiError?.details)
    ? apiError.details.map((detail) => detail?.message).filter(Boolean)
    : [];

  return [apiError?.message || error.message || fallback, ...details].join(" ");
};

export function useTutorProfile() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileData, subjectData] = await Promise.all([
        tutorProfileService.getMyProfile(),
        tutorProfileService.getSubjects(),
      ]);
      setProfile(profileData);
      setSubjects(subjectData);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load tutor profile"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (payload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updatedProfile = await tutorProfileService.updateMyProfile(payload);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to update tutor profile"));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    profile,
    subjects,
    isLoading,
    isSaving,
    error,
    fetchProfile,
    updateProfile,
  };
}
