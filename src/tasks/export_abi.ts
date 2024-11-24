import { name as pluginName } from '../../package.json';
import { AbiExporterConfigEntry } from '../index';
import { abiToTs } from './utils';
import { Interface, FormatTypes } from '@ethersproject/abi';
import fs from 'fs';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { task, subtask, types } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import path from 'path';

task('export-abi')
  .addFlag('noCompile', "Don't compile before running this task")
  .setAction(async (args, hre) => {
    if (!args.noCompile) {
      await hre.run(TASK_COMPILE, { noExportAbi: true });
    }

    const configs = hre.config.abiExporter;

    await Promise.all(
      configs.map((abiGroupConfig) => {
        return hre.run('export-abi-group', { abiGroupConfig });
      }),
    );
  });

subtask('export-abi-group')
  .addParam(
    'abiGroupConfig',
    'a single abi-exporter config object',
    undefined,
    types.any,
  )
  .setAction(async (args, hre) => {
    const { abiGroupConfig: config } = args as {
      abiGroupConfig: AbiExporterConfigEntry;
    };

    const outputDirectory = path.resolve(hre.config.paths.root, config.path);

    if (outputDirectory === hre.config.paths.root) {
      throw new HardhatPluginError(
        pluginName,
        'resolved path must not be root directory',
      );
    }

    const outputData: { abi: string[]; destination: string }[] = [];

    const fullNames = await hre.artifacts.getAllFullyQualifiedNames();

    await Promise.all(
      fullNames.map(async (fullName) => {
        if (config.only.length && !config.only.some((m) => fullName.match(m)))
          return;
        if (
          config.except.length &&
          config.except.some((m) => fullName.match(m))
        )
          return;

        let { abi, sourceName, contractName } =
          await hre.artifacts.readArtifact(fullName);

        if (!abi.length) return;

        abi = abi.filter((element, index, array) =>
          config.filter(element, index, array, fullName),
        );

        if (config.format == 'minimal') {
          abi = [new Interface(abi).format(FormatTypes.minimal)].flat();
        } else if (config.format == 'fullName') {
          abi = [new Interface(abi).format(FormatTypes.fullName)].flat();
        } else if (config.format != 'json') {
          throw new HardhatPluginError(
            pluginName,
            `Unknown format: ${config.format}`,
          );
        }

        const destination = path.resolve(
          outputDirectory,
          config.rename(sourceName, contractName),
        );

        outputData.push({ abi, destination });
      }),
    );

    outputData.reduce(
      (acc: { [destination: string]: string[] }, { abi, destination }) => {
        const contents = acc[destination];

        if (contents && JSON.stringify(contents) !== JSON.stringify(abi)) {
          throw new HardhatPluginError(
            pluginName,
            `multiple distinct contracts share same output destination: ${destination}`,
          );
        }

        acc[destination] = abi;
        return acc;
      },
      {},
    );

    if (config.clear) {
      await hre.run('clear-abi-group', { path: config.path });
    }

    await Promise.all(
      outputData.map(async ({ abi, destination }) => {
        await fs.promises.mkdir(path.dirname(destination), { recursive: true });
        const outputJson = JSON.stringify(abi, null, config.spacing);
        await fs.promises.writeFile(`${destination}.json`, `${outputJson}\n`, {
          flag: 'w',
        });

        if (config.tsWrapper) {
          await fs.promises.writeFile(
            `${destination}.ts`,
            abiToTs(outputJson),
            {
              flag: 'w',
            },
          );
        }
      }),
    );
  });
