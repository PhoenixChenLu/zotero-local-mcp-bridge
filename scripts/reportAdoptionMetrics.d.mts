export type GitHubReleaseMetrics = {
  tagName: string;
  publishedAt: string;
  xpiDownloads: number;
};

export type GitHubMetrics = {
  repositoryUrl: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  authentication: "token" | "unauthenticated";
  totalXpiDownloads: number;
  releases: GitHubReleaseMetrics[];
};

export type NpmMetrics = {
  packageName: string;
  latestVersion: string;
  lastWeekDownloads: number;
};

export type AdoptionMetrics = {
  capturedAt: string;
  github?: GitHubMetrics;
  npm?: NpmMetrics;
  warnings: string[];
};

export type MetricsOptions = {
  fetchImpl?: typeof fetch;
  repository?: string;
  packageName?: string;
  token?: string;
  capturedAt?: Date;
};

export function collectGitHubMetrics(options?: MetricsOptions): Promise<GitHubMetrics>;
export function collectNpmMetrics(options?: MetricsOptions): Promise<NpmMetrics>;
export function collectAdoptionMetrics(options?: MetricsOptions): Promise<AdoptionMetrics>;
export function formatMetricsReport(metrics: AdoptionMetrics): string;
