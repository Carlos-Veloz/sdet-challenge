export const ENVIRONMENTS = ['dev', 'prod'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

/** Host where the Docker container is exposed. The environment prefix is added by the client. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/** Token accepted by the protected DELETE endpoint (same for dev and prod). */
export const AUTH_TOKEN = process.env.AUTH_TOKEN ?? 'mysecrettoken';

export const otherEnvironment = (env: Environment): Environment => (env === 'dev' ? 'prod' : 'dev');
