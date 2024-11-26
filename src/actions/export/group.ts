import fs from 'node:fs';
import path from 'node:path';
import { FormatTypes, Interface } from '@ethersproject/abi';
import { HardhatPluginError } from '@ignored/hardhat-vnext/plugins';
import type { Abi } from '@ignored/hardhat-vnext/types/artifacts';
import type { NewTaskActionFunction } from '@ignored/hardhat-vnext/types/tasks';
import pkg from '../../../package.json' with { type: 'json' };
import { abiToTs } from '../utils.js';

interface ExportAbiGroupActionArguments {
  path: string;
}

const exportAbiGroupAction: NewTaskActionFunction<
  ExportAbiGroupActionArguments
> = async (args, hre) => {
  const config = hre.config.abiExporter.find(
    (entry) => entry.path === args.path,
  );
  if (config == null) return;

  const outputDirectory = path.resolve(hre.config.paths.root, config.path);

  if (outputDirectory === hre.config.paths.root) {
    throw new HardhatPluginError(
      pkg.name,
      'resolved path must not be root directory',
    );
  }

  const outputData: {
    abi: string[] | readonly Abi[];
    destination: string;
  }[] = [];

  const fullNames = await hre.artifacts.getAllFullyQualifiedNames();

  await Promise.all(
    fullNames.map(async (fullName) => {
      if (config.only.length && !config.only.some((m) => fullName.match(m))) {
        return;
      }
      if (
        config.except.length &&
        config.except.some((m) => fullName.match(m))
      ) {
        return;
      }

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
          pkg.name,
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
    (
      acc: { [destination: string]: string[] | readonly Abi[] },
      { abi, destination },
    ) => {
      const contents = acc[destination];

      if (contents && JSON.stringify(contents) !== JSON.stringify(abi)) {
        throw new HardhatPluginError(
          pkg.name,
          `multiple distinct contracts share same output destination: ${destination}`,
        );
      }

      acc[destination] = abi;
      return acc;
    },
    {},
  );

  if (config.clear) {
    await hre.tasks.getTask(['clear-abi', 'group']).run({
      path: config.path,
    });
  }

  await Promise.all(
    outputData.map(async ({ abi, destination }) => {
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      const outputJson = JSON.stringify(abi, null, config.spacing);
      await fs.promises.writeFile(`${destination}.json`, `${outputJson}\n`, {
        flag: 'w',
      });

      if (config.tsWrapper) {
        await fs.promises.writeFile(`${destination}.ts`, abiToTs(outputJson), {
          flag: 'w',
        });
      }
    }),
  );
};

export default exportAbiGroupAction;
