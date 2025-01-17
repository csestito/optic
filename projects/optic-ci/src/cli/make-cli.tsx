import { program as cli } from 'commander';
import { exec } from 'child_process';
import { registerCompare } from './commands/compare';
import { registerBulkCompare } from './commands/bulk-compare';
import { initSentry } from '@useoptic/openapi-utilities/build/utilities/sentry';
import { CliConfig } from './types';
import {
  registerCreateContext,
  registerCreateGithubContext,
} from './commands/create-context/create-github-context';
import { registerCreateManualContext } from './commands/create-context/create-manual-context';
import { registerCreateGitlabContext } from './commands/create-context/create-gitlab-context';
import { RuleRunner, SpectralInput } from '@useoptic/openapi-utilities';
import {
  trackEvent,
  initSegment,
} from '@useoptic/openapi-utilities/build/utilities/segment';
const packageJson = require('../../package.json');

export async function getProjectName(): Promise<string> {
  try {
    const stdoutPromise = new Promise<string>((resolve, reject) => {
      exec(
        'basename `git rev-parse --show-toplevel`',
        {
          cwd: process.cwd(),
        },
        (error, stdout) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      );
    });
    const stdout = await stdoutPromise;
    return stdout.trim();
  } catch (e) {
    return 'unknown-project';
  }
}

export async function makeCiCli(
  checkService: RuleRunner,
  options: CliConfig = {},
  generateContext: (details: { fileName: string }) => Object = () => ({}),
  spectralConfig?: SpectralInput
) {
  return _makeCiCliInternal(
    checkService,
    options,
    false,
    generateContext,
    spectralConfig
  );
}

export async function _makeCiCliInternal(
  checkService: RuleRunner,
  options: CliConfig = {},
  directlyCalled: boolean,
  generateContext: (details: { fileName: string }) => Object = () => ({}),
  spectralConfig?: SpectralInput
) {
  initSentry(process.env.SENTRY_URL, packageJson.version);
  const projectName = await getProjectName();
  initSegment(process.env.SEGMENT_KEY);
  trackEvent('optic-ci-run', projectName);

  cli.version(
    `for ${projectName}, running optic api-check ${packageJson.version}`
  );
  const shouldHideV1Commands = directlyCalled;
  const shouldHideV2Commands = !directlyCalled;

  registerCreateContext(cli, shouldHideV1Commands);
  registerCreateGithubContext(cli);
  registerCreateGitlabContext(cli, shouldHideV1Commands);
  registerCreateManualContext(cli);
  registerCompare(
    cli,
    projectName,
    checkService,
    options,
    generateContext,
    shouldHideV1Commands,
    spectralConfig
  );
  registerBulkCompare(
    cli,
    projectName,
    checkService,
    options,
    generateContext,
    shouldHideV1Commands,
    spectralConfig
  );

  return cli;
}
