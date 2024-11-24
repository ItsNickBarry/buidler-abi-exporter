import { abiToTs, abiFromTs } from '../src/tasks/utils';
import jsonAbi from './erc20.json';
import { Interface } from '@ethersproject/abi';
import * as fs from 'fs';
import { expect, test } from 'vitest';

const lintedTs = fs.readFileSync('./test/linted-erc20.ts', 'utf8');
const unlintedTs = fs.readFileSync('./test/unlinted-erc20.ts', 'utf8');

const stringify = (val: any): string => JSON.stringify(val, null, 2);

test('abi -> json -> unlinted TS', () => {
  expect(abiToTs(stringify(jsonAbi))).toBe(unlintedTs);
});

test('linted TS -> json -> abi', () => {
  expect(stringify(abiFromTs(lintedTs))).toBe(stringify(jsonAbi));
});

test('unlinted TS -> json -> abi', () => {
  expect(stringify(abiFromTs(unlintedTs))).toBe(stringify(jsonAbi));
});

test('ethers parsing', () => {
  expect(() => new Interface(stringify(abiFromTs(unlintedTs)))).not.toThrow();
});
