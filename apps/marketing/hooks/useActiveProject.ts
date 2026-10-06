import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";

export const useActiveProject = () => {
    const { data: activeProjectResponse, isLoading: isLoadingActiveProject } = useGetActiveProjectQuery();
    const activeProjectId = activeProjectResponse?.data?.id;
    return { activeProjectId, isLoadingActiveProject };
};