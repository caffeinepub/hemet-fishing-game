import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useTopScores() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["topScores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playerName,
      score,
      fishCount,
    }: {
      playerName: string;
      score: number;
      fishCount: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      await actor.addScore(
        playerName,
        BigInt(score),
        BigInt(fishCount),
        BigInt(Date.now()),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topScores"] });
    },
  });
}
