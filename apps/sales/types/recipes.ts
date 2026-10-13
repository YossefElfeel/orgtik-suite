export type CrmRecipe = { id: string; title: string; pipelineId: string; stageId: string; projectId: number; sectionId: number; enabled: boolean };
export type CrmRecipeData = { recipes: CrmRecipe[]; runs: { recipeId: string; eventId: string; contactId: string; state: "created" | "blocked"; taskId?: number; path?: string; code?: string; at: string }[]; canConfigure: boolean };
export type CrmTaskDestination = { id: number; title: string; sections: { id: number; title: string; flag: string }[] };
