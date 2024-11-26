import fs from 'node:fs';
import path from 'node:path';
import { Interface } from '@ethersproject/abi';
import type { NewTaskActionFunction } from '@ignored/hardhat-vnext/types/tasks';
import deleteEmpty from 'delete-empty';
import { abiFromTs } from '../utils.js';

interface ClearAbiGroupActionArguments {
  path: string;
}

const clearAbiGroupAction: NewTaskActionFunction<
  ClearAbiGroupActionArguments
> = async (args, hre) => {
  const configForPath = hre.config.abiExporter.find(
    (config) => config.path === args.path,
  );
  if (configForPath == null) return;
  const outputDirectory = path.resolve(hre.config.paths.root, args.path);

  if (!fs.existsSync(outputDirectory)) {
    return;
  }

  const files = readdirRecursive(outputDirectory);

  await Promise.all(
    files.map(async (file) => {
      if (path.extname(file) !== '.json') {
        // ABIs must be stored as JSON
        return;
      }

      const contents = (await fs.promises.readFile(file)).toString();

      try {
        // attempt to parse ABI from file contents
        new Interface(contents);
      } catch (e) {
        // file is not an ABI - do not delete
        return;
      }

      await fs.promises.rm(file);

      {
        // load the ts file from disk
        const tsWrappedFile = path.format({
          ...path.parse(file),
          base: '',
          ext: '.ts',
        });
        const tsContent = await fs.promises.readFile(tsWrappedFile, 'utf-8');

        // `spacing` is a setting, so to help with comparison we normalize to 2-spaces
        const normalizedABI = JSON.stringify(JSON.parse(contents), null, 2);
        // convert the TS file to what should be the same format at the normalized ABI
        const tsAsAbi = JSON.stringify(abiFromTs(tsContent), null, 2);

        if (normalizedABI === tsAsAbi) {
          // note: no need to check if the ts ABI is valid ABI
          // since we already checked `normalizedABI` is a valid ABI earlier
          // and if these two are equal, then transitively `tsAsAbi` is valid ABI as well
          await fs.promises.rm(
            tsWrappedFile,
            // do not error if the file doesn't exist
            { force: true },
          );
        }
      }
    }),
  );

  await deleteEmpty(outputDirectory);
};

const readdirRecursive = (dirPath: string, output: string[] = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    file = path.join(dirPath, file);

    if (fs.statSync(file).isDirectory()) {
      output = readdirRecursive(file, output);
    } else {
      output.push(file);
    }
  });

  return output;
};

export default clearAbiGroupAction;
