import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface CliOptions {
  gh_api_key: string;
  gh_owner: string;
  port?: number;
  debug?: boolean;
}

/**
 * Parse command line arguments
 * @returns Object containing CLI options
 */
export function parseCliArguments(): CliOptions {
  const argv = yargs(hideBin(process.argv))
    .option('gh_api_key', {
      alias: 'k',
      describe: 'GitHub API key to use for requests',
      type: 'string',
      demandOption: true,
      requiresArg: true,
    })
    .option('gh_owner', {
      alias: 'o',
      describe: 'GitHub owner (organization or user) to use for requests',
      type: 'string',
      demandOption: true,
      requiresArg: true,
    })
    .option('port', {
      alias: 'p',
      describe: 'Port to run the server on',
      type: 'number',
    })
    .option('debug', {
      alias: 'd',
      describe: 'Enable debug logging',
      type: 'boolean',
      default: false,
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return {
    gh_api_key: argv.gh_api_key as string,
    gh_owner: argv.gh_owner as string,
    port: argv.port,
    debug: argv.debug,
  };
}
