import { rmSync } from "node:fs";
import path from "node:path";

// genlayer-cli transpiles deployScript.ts beside the source. If a previous
// run is interrupted, its scanner may execute that generated file as a second
// deployment script on the next run. Remove only this known build artifact.
rmSync(path.resolve(process.cwd(), "deploy/deployScript.compiled.js"), { force: true });
