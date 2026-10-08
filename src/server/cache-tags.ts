// Cache invalidation tags
export const tags = {
  projectsList: "projects:list",
  project: (id: string) => `project:${id}`,
  postsList: "posts:list",
  post: (id: string) => `post:${id}`,
  settings: "settings",
  taxonomies: "taxonomies",
  media: (id: string) => `media:${id}`,
} as const;
