import fs from 'fs';
import path from 'path';
import { Command, Option } from 'commander';
import { UserError } from '../../errors';
import { wrapActionHandlerWithSentry } from '../../sentry';
import { NormalizedCiContext } from '../../types';
import {
  DEFAULT_CONTEXT_PATH,
  SUPPORTED_GITLAB_CI_PROVIDERS,
} from '../constants';
import { getContextFromGitlabEnvironment } from './context-readers/gitlab/gitlab-ci';

export const registerCreateGitlabContext = (cli: Command) => {
  cli
    .command('create-gitlab-context')
    .addHelpText(
      'before',
      'Creates a context object used for uploading specs to Optic cloud. This is intended to be used with gitlab.'
    )
    .addOption(
      new Option(
        '--provider <provider>',
        `the ci provider that this command should try extract the relevant values from. supported providers are: ${SUPPORTED_GITLAB_CI_PROVIDERS.join(
          ', '
        )}`
      ).choices([...SUPPORTED_GITLAB_CI_PROVIDERS])
    )
    .action(
      wrapActionHandlerWithSentry(
        async ({
          provider,
        }: {
          provider: typeof SUPPORTED_GITLAB_CI_PROVIDERS[number];
        }) => {
          if (!provider) {
            throw new UserError('Cannot create context without a provider');
          }
          if (!SUPPORTED_GITLAB_CI_PROVIDERS.includes(provider)) {
            throw new UserError(
              `Unexpected provider '${provider}', supported ci providers are: ${SUPPORTED_GITLAB_CI_PROVIDERS.join(
                ', '
              )}`
            );
          }
          createContext(provider);
        }
      )
    );
};

const createContext = (
  provider: typeof SUPPORTED_GITLAB_CI_PROVIDERS[number]
) => {
  let normalizedContext: NormalizedCiContext;
  if (provider === 'gitlab') {
    normalizedContext = getContextFromGitlabEnvironment();
  } else {
    return console.error('Unexpected provider, ', provider);
  }

  const contextFilePath = path.join(process.cwd(), DEFAULT_CONTEXT_PATH);
  if (fs.existsSync(contextFilePath)) {
    console.log(`Context file already exists at ${contextFilePath}`);
  } else {
    fs.writeFileSync(
      contextFilePath,
      Buffer.from(JSON.stringify(normalizedContext))
    );
    console.log(`Context file written to ${contextFilePath}`);
  }
};