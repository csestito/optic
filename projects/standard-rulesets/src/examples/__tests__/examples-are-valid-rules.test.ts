import { test, expect, describe } from '@jest/globals';
import { OpenAPIV3 } from '@useoptic/openapi-utilities';
import { TestHelpers } from '@useoptic/rulesets-base';
import { ExamplesRuleset } from '../index';

describe('fromOpticConfig', () => {
  test('invalid configuration', async () => {
    const out = await ExamplesRuleset.fromOpticConfig({
      require_parameter_examples: 123,
    });
    expect(out).toEqual(
      '- ruleset/examples/require_parameter_examples must be boolean'
    );
  });
});

describe('examples ruleset', () => {
  test('invalid property example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        wrong: {
                          type: 'string',
                          example: 12345,
                        },
                        notSet: {
                          type: 'string',
                        },
                        setAndCorrect: {
                          type: 'string',
                          example: 'abcdefg',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });
  test('invalid parameter example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          get: {
            parameters: [
              {
                in: 'query',
                name: 'invalidExample',
                schema: { type: 'string' },
                example: 123,
              },
              {
                in: 'query',
                name: 'validExample',
                schema: { type: 'string' },
                example: '123',
              },
              {
                in: 'query',
                name: 'notSet',
                schema: { type: 'string' },
              },
            ],
            responses: {},
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });

  const exampleSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['hello', 'world'],
    properties: {
      hello: { type: 'string' },
      world: { type: 'number' },
    },
  };

  const exampleInvalid = {
    hello: 123,
  };

  const exampleValid = {
    hello: '123',
    world: 123,
  };

  test('invalid response top level example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: exampleSchema,
                    example: exampleInvalid,
                  },
                },
              },
            },
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });
  test('invalid response named example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: exampleSchema,
                    examples: {
                      main: {
                        value: exampleInvalid,
                      },
                      other: {
                        value: exampleValid,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });

  test('invalid request top level example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          post: {
            responses: {},
            requestBody: {
              description: '',
              content: {
                'application/json': {
                  schema: exampleSchema,
                  example: exampleInvalid,
                },
              },
            },
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });
  test('invalid request named example errors', async () => {
    const input: OpenAPIV3.Document = {
      ...TestHelpers.createEmptySpec(),
      paths: {
        '/api/users': {
          post: {
            responses: {},
            requestBody: {
              description: 'ok',
              content: {
                'application/json': {
                  schema: exampleSchema,
                  examples: {
                    main: {
                      value: exampleInvalid,
                    },
                    other: {
                      value: exampleValid,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const results = await TestHelpers.runRulesWithInputs(
      [new ExamplesRuleset({})],
      input,
      input
    );
    expect(results.length > 0).toBe(true);

    expect(results).toMatchSnapshot();
    expect(results.some((result) => !result.passed)).toBe(true);
  });
});
