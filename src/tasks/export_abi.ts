import fs from 'node:fs';
import path from 'node:path';
import { FormatTypes, Interface } from '@ethersproject/abi';
import { task } from '@ignored/hardhat-vnext/config';
import { HardhatPluginError } from '@ignored/hardhat-vnext/plugins';
import { ArgumentType } from '@ignored/hardhat-vnext/types/arguments';
import type { Abi } from '@ignored/hardhat-vnext/types/artifacts';
import pkg from '../../package.json' with { type: 'json' };

export const exportAbiTask = task('export-abi')
  .addFlag({
    name: 'noCompile',
    description: "Don't compile before running this task",
  })
  .setAction(import.meta.resolve('../actions/export/all.js'))
  .build();

export const exportAbiGroupTask = task(['export-abi', 'group'])
  .addPositionalArgument({
    name: 'path',
    description: 'path to look for ABIs',
    type: ArgumentType.STRING,
    defaultValue: undefined,
  })
  .setAction(import.meta.resolve('../actions/export/group.js'))
  .build();
