import * as path from "path";
import * as fs from "fs";

export function getLatestAuthStorageState(): string | undefined {
  const testResultsDir = path.join(process.cwd(), "reports/test-results");

  if (!fs.existsSync(testResultsDir)) {
    return undefined;
  }

  const allDir = fs
    .readdirSync(testResultsDir)
    .map((dirName) => path.join(testResultsDir, dirName))
    .filter((dirName) => {
      if (!fs.statSync(dirName).isDirectory()) return false;
      const storageStatePath = path.join(dirName, "storageState.json");
      return fs.existsSync(storageStatePath);
    })
    .sort(
      (a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime(),
    );

  if (allDir.length > 0) {
    return path.join(allDir[0], "storageState.json");
  }

  return undefined;
}

export function getStorageStateConfig(): string | undefined {
  const dynamicStorageStatePath = getLatestAuthStorageState();
  const defaultStorageStatePath = path.join(
    process.cwd(),
    "src/core/utils/storageState.json",
  );
  return (
    dynamicStorageStatePath ||
    (fs.existsSync(defaultStorageStatePath)
      ? defaultStorageStatePath
      : undefined)
  );
}
