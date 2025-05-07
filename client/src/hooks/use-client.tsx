import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { Client } from "@shared/schema";

export function useClient() {
  const { user } = useAuth();
  
  const { data: client, isLoading } = useQuery<Client | undefined>({
    queryKey: ["/api/client/current"],
    enabled: !!user && user.role === "client",
  });

  return {
    client,
    isLoading,
    clientId: client?.id
  };
}