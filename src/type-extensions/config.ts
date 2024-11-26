import '@ignored/hardhat-vnext/types/config';

export interface AbiExporterUserConfigEntry {
  path?: string;
  runOnCompile?: boolean;
  clear?: boolean;
  flat?: boolean;
  tsWrapper?: boolean;
  only?: string[];
  except?: string[];
  spacing?: number;
  pretty?: boolean;
  format?: 'minimal' | 'fullName' | 'json';
  filter?: (
    abiElement: any,
    index: number,
    abi: any,
    fullyQualifiedName: string,
  ) => boolean;
  rename?: (sourceName: string, contractName: string) => string;
}

export type AbiExporterConfigEntry = Required<AbiExporterUserConfigEntry>;

declare module '@ignored/hardhat-vnext/types/config' {
  interface HardhatUserConfig {
    abiExporter?: AbiExporterUserConfigEntry | AbiExporterUserConfigEntry[];
  }

  interface HardhatConfig {
    abiExporter: AbiExporterConfigEntry[];
  }
}
