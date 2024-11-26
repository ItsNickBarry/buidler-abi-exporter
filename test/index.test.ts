import * as fs from 'node:fs';
import { Interface } from '@ethersproject/abi';
import { expect, test } from 'vitest';
import { abiFromTs, abiToTs } from '../src/actions/utils.js';
import jsonAbi from './erc20.json' with { type: 'json' };

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
