import '../type-extensions/config.js';
import { overrideTask } from '@ignored/hardhat-vnext/config';

export const postCompileTask = overrideTask('compile')
  .addFlag({
    name: 'noExportAbi',
    description:
      "Don't export ABI after running this task, even if runOnCompile option is enabled",
  })
  .setAction(import.meta.resolve('../actions/compile.js'))
  .build();
