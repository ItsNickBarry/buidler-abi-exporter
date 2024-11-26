import '../type-extensions/config.js';
import { task } from '@ignored/hardhat-vnext/config';
import { ArgumentType } from '@ignored/hardhat-vnext/types/arguments';

export const clearAbiTask = task('clear-abi')
  .setAction(import.meta.resolve('../actions/clear/all.js'))
  .build();

export const clearAbiGroupTask = task(['clear-abi', 'group'])
  .addPositionalArgument({
    name: 'path',
    description: 'path to look for ABIs',
    type: ArgumentType.STRING,
    defaultValue: undefined,
  })
  .setAction(import.meta.resolve('../actions/clear/group.js'))
  .build();
