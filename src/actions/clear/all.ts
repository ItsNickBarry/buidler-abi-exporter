import type { NewTaskActionFunction } from '@ignored/hardhat-vnext/types/tasks';

type ClearAbiActionArguments = Record<string, never>;

const clearAbiAction: NewTaskActionFunction<ClearAbiActionArguments> = async (
  _,
  hre,
) => {
  const configs = hre.config.abiExporter;

  await Promise.all(
    configs.map((abiExporterConfig) => {
      return hre.tasks.getTask(['clear-abi', 'group']).run({
        path: abiExporterConfig.path,
      });
    }),
  );
};

export default clearAbiAction;
