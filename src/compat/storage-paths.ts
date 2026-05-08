import { join } from 'node:path';
import {
  getGlobalDataDir,
  getGlobalLogDir,
  getProjectStateDir,
} from '../paths/plugin-paths';

export interface CompatStoragePaths {
  runtimeId: string;
  workspaceRoot: string;
  projectRoot: string;
  projectStateDir: string;
  runtimeStateDir: string;
  runtimeLogDir: string;
  runtimeCacheDir: string;
  runtimeMemoryDir: string;
  runtimeInstallDir: string;
  globalDataDir: string;
  globalLogDir: string;
  globalCompatDir: string;
  globalRuntimeDir: string;
  globalRuntimeLogDir: string;
  globalRuntimeMemoryDir: string;
}

export function getCompatStoragePaths(
  workspaceRoot: string,
  runtimeId: string,
): CompatStoragePaths {
  const projectStateDir = getProjectStateDir(workspaceRoot);
  const runtimeStateDir = join(projectStateDir, 'compat', runtimeId);
  const globalDataDir = getGlobalDataDir();
  const globalCompatDir = join(globalDataDir, 'compat');
  const globalRuntimeDir = join(globalCompatDir, runtimeId);

  return {
    runtimeId,
    workspaceRoot,
    projectRoot: workspaceRoot,
    projectStateDir,
    runtimeStateDir,
    runtimeLogDir: join(runtimeStateDir, 'logs'),
    runtimeCacheDir: join(runtimeStateDir, 'cache'),
    runtimeMemoryDir: join(runtimeStateDir, 'memory'),
    runtimeInstallDir: join(runtimeStateDir, 'install'),
    globalDataDir,
    globalLogDir: getGlobalLogDir(),
    globalCompatDir,
    globalRuntimeDir,
    globalRuntimeLogDir: join(globalRuntimeDir, 'logs'),
    globalRuntimeMemoryDir: join(globalRuntimeDir, 'memory'),
  };
}
