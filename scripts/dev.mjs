import { execSync } from 'node:child_process';
const cmd = `npx concurrently -n home,operator,display -c auto "pnpm --filter @app/home dev" "pnpm --filter @app/operator dev" "pnpm --filter @app/display dev"`;
execSync(cmd, { stdio: 'inherit' });