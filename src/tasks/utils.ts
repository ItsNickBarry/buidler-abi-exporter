import JSON5 from 'json5';

export function abiToTs(json: string): string {
  return `export default ${json} as const;`;
}

/**
 * Extract an ABI from a typescript file
 * note: this function has to support the fact that linting tools might modify the Typescript file slightly
 */
export function abiFromTs(ts: string): any {
  // remove \n and \r characters to help remove the prefix & suffix
  const noSpacing = ts.trim().replace(/\n|\r/g, '');
  // remove the surrounding `export default` and `as const;`
  const inner = noSpacing.slice('export default '.length, -' as const;'.length);

  // we need to parse to take into account the fact that a linter may have changed some of the types
  // ex: { "key": "value" } can be changed into { key: "value" }
  // fortunately, JSON5 handles most of these common conversions
  const parsed = JSON5.parse(inner);
  return parsed;
}
