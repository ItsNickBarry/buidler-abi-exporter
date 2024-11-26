import '../type-extensions/config.js';
import path from 'node:path';
import type {
  ConfigurationVariable,
  HardhatConfig,
  HardhatUserConfig,
  ResolvedConfigurationVariable,
} from '@ignored/hardhat-vnext/types/config';
import type {
  ConfigHooks,
  HardhatUserConfigValidationError,
} from '@ignored/hardhat-vnext/types/hooks';
import type {
  AbiExporterConfigEntry,
  AbiExporterUserConfigEntry,
} from '../type-extensions/config.js';

export default async (): Promise<Partial<ConfigHooks>> => ({
  extendUserConfig,
  validateUserConfig,
  resolveUserConfig,
});

const DEFAULT_CONFIG: Omit<AbiExporterConfigEntry, 'format' | 'rename'> = {
  path: './abi',
  runOnCompile: false,
  clear: false,
  flat: false,
  tsWrapper: false,
  only: [],
  except: [],
  spacing: 2,
  pretty: false,
  filter: () => true,
  // `rename` is not defaulted as it may depend on `flat` option
  // `format` is not defaulted as it may depend on `pretty` option
};

function toArray(
  abiExporter:
    | undefined
    | AbiExporterUserConfigEntry
    | AbiExporterUserConfigEntry[],
) {
  if (abiExporter == null) return [];
  if (Array.isArray(abiExporter)) {
    return abiExporter;
  }
  return [abiExporter];
}

export async function extendUserConfig(
  config: HardhatUserConfig,
  next: (nextConfig: HardhatUserConfig) => Promise<HardhatUserConfig>,
): Promise<HardhatUserConfig> {
  const extendedConfig = await next(config);

  return {
    ...extendedConfig,
    abiExporter: toArray(extendedConfig.abiExporter),
  };
}

export async function validateUserConfig(
  userConfig: HardhatUserConfig,
): Promise<HardhatUserConfigValidationError[]> {
  const errors: HardhatUserConfigValidationError[] = [];
  for (const conf of toArray(userConfig.abiExporter)) {
    if (conf.flat && conf.rename) {
      errors.push({
        path: ['abiExporter', 'flat'],
        message: '`flat` & `rename` config cannot be specified together',
      });
    }

    if (conf.pretty && conf.format) {
      errors.push({
        path: ['abiExporter', 'pretty'],
        message: '`pretty` & `format` config cannot be specified together',
      });
    }
  }
  return errors;
}

export async function resolveUserConfig(
  userConfig: HardhatUserConfig,
  resolveConfigurationVariable: (
    variableOrString: ConfigurationVariable | string,
  ) => ResolvedConfigurationVariable,
  next: (
    nextUserConfig: HardhatUserConfig,
    nextResolveConfigurationVariable: (
      variableOrString: ConfigurationVariable | string,
    ) => ResolvedConfigurationVariable,
  ) => Promise<HardhatConfig>,
): Promise<HardhatConfig> {
  const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
  const abiExporter = toArray(userConfig.abiExporter);

  const result: AbiExporterConfigEntry[] = [];
  for (let i = 0; i < abiExporter.length; i++) {
    const conf = Object.assign({}, DEFAULT_CONFIG, abiExporter[i]);

    result.push({
      ...conf,
      format: (conf.format ?? conf.pretty) ? 'minimal' : 'json',
      rename:
        conf.rename ??
        (conf.flat
          ? (sourceName, contractName) => contractName
          : (sourceName, contractName) => path.join(sourceName, contractName)),
    });
  }

  return {
    ...resolvedConfig,
    abiExporter: result,
  };
}
