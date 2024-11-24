import { name as pluginName } from '../package.json';
import './tasks/clear_abi';
import './tasks/compile';
import './tasks/export_abi';
import { extendConfig } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import 'hardhat/types/config';
import path from 'path';

interface AbiExporterUserConfigEntry {
  path?: string;
  runOnCompile?: boolean;
  clear?: boolean;
  flat?: boolean;
  tsWrapper?: boolean;
  only?: string[];
  except?: string[];
  spacing?: number;
  pretty?: boolean;
  format?: string;
  filter?: (
    abiElement: any,
    index: number,
    abi: any,
    fullyQualifiedName: string,
  ) => boolean;
  rename?: (sourceName: string, contractName: string) => string;
}

export interface AbiExporterConfigEntry {
  path: string;
  runOnCompile: boolean;
  clear: boolean;
  flat: boolean;
  tsWrapper: boolean;
  only: string[];
  except: string[];
  spacing: number;
  pretty: boolean;
  format: string;
  filter: (
    abiElement: any,
    index: number,
    abi: any,
    fullyQualifiedName: string,
  ) => boolean;
  rename: (sourceName: string, contractName: string) => string;
}

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    abiExporter?: AbiExporterUserConfigEntry | AbiExporterUserConfigEntry[];
  }

  interface HardhatConfig {
    abiExporter: AbiExporterConfigEntry[];
  }
}

const DEFAULT_CONFIG = {
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

extendConfig((config, userConfig) => {
  config.abiExporter = [userConfig.abiExporter].flat().map((el) => {
    const conf = Object.assign({}, DEFAULT_CONFIG, el);

    if (conf.flat && conf.rename) {
      throw new HardhatPluginError(
        pluginName,
        '`flat` & `rename` config cannot be specified together',
      );
    }

    if (conf.pretty && conf.format) {
      throw new HardhatPluginError(
        pluginName,
        '`pretty` & `format` config cannot be specified together',
      );
    }

    if (conf.flat) {
      conf.rename = (sourceName, contractName) => contractName;
    }

    if (!conf.rename) {
      conf.rename = (sourceName, contractName) =>
        path.join(sourceName, contractName);
    }

    if (!conf.format) {
      conf.format = conf.pretty ? 'minimal' : 'json';
    }

    return conf as AbiExporterConfigEntry;
  });
});
