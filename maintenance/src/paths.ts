import path from "node:path";
import * as dotenv from "dotenv";

// Compiled helpers live in maintenance/build/src.
const maintenanceDirectory = path.resolve(__dirname, "../..");
export const dataDirectory = path.resolve(maintenanceDirectory, "../src/mocks");

dotenv.config({ path: path.join(maintenanceDirectory, ".env"), quiet: true });
