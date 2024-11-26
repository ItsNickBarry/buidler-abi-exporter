import type { TaskOverrideActionFunction } from '@ignored/hardhat-vnext/types/tasks';

interface CompileActionArguments {
  noExportAbi: boolean;
}

const clearAbiAction: TaskOverrideActionFunction<
  CompileActionArguments
> = async (args, hre, runSuper) => {
  await runSuper(args);

  if (!args.noExportAbi && !(hre as any).__SOLIDITY_COVERAGE_RUNNING) {
    const configs = hre.config.abiExporter;

    await Promise.all(
      configs.map((abiGroupConfig) => {
        if (abiGroupConfig.runOnCompile) {
          return hre.tasks.getTask(['export-abi', 'group']).run({
            path: abiGroupConfig.path,
          });
        }
      }),
    );
  }
};

export default clearAbiAction;
