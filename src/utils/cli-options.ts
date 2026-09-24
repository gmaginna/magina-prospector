type Environment = Record<string, string | undefined>;

export function optionValue(name: string, args: string[], environment: Environment = process.env): string | undefined {
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];

  const inline = args.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);

  const npmConfigName = name.slice(2).replaceAll("-", "_");
  return environment[`npm_config_${npmConfigName}`];
}

export function hasOption(name: string, args: string[], environment: Environment = process.env): boolean {
  const value = optionValue(name, args, environment);
  return args.includes(name) || value === "true" || value === "1";
}
