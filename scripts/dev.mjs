import { execSync } from 'node:child_process';
const cmd = `npx concurrently -n operator,display -c auto "npm run dev -w @app/operator" "npm run dev -w @app/display"`;
execSync(cmd, { stdio: 'inherit' });