import { API_BASE } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    createdAt?: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
} | null;

const fetchMe = async (): Promise<MeResponse> => {
  const response = await fetch(`${API_BASE}/api/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
};

export const useMeQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled,
    staleTime: 60_000,
  });
