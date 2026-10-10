// Retired projects stay available for historical references, but cannot enter a rollout.
export function selectDeploymentProjects(projects, { affectedPackages = [], requested = [], environment = 'preview', manualMain = false } = {}) {
  for (const key of requested) {
    if (!projects[key]) throw new Error(`Unknown requested deployment project: ${key}`);
    if (projects[key].retired) throw new Error(`${key}: retired project deployments are disabled`);
  }
  if (requested.length && environment !== 'preview' && !manualMain) throw new Error('A limited project selection is only allowed for previews');
  const affected = new Set(affectedPackages), priority = ['mock', 'sos', 'website'];
  return Object.entries(projects)
    .filter(([key, project]) => !project.retired && (requested.length ? requested.includes(key) : affected.has(project.package)))
    .map(([key, project]) => ({ key, ...project }))
    .sort((a, b) => (priority.indexOf(a.key) < 0 ? priority.length : priority.indexOf(a.key)) - (priority.indexOf(b.key) < 0 ? priority.length : priority.indexOf(b.key)));
}
