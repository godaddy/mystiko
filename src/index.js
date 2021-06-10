const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const logger = require('./logger.js');
const fs = require('fs/promises');
const TARGETS = [ 'file', 'env' ];
const Ajv = require('ajv')
const path = require('path');


class MystikoError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name
  }
}

class SchemaValidationError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name
  }
}

class ConfigError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name
  }
}

const errorMessages = {
  DecryptionFailureException: 'Secrets Manager can\'t decrypt the protected secret text using the provided KMS key',
  AccessDeniedException: 'Access denied to current user',
  InternalServiceErrorException: 'An error occurred on the server side',
  InvalidParameterException: 'You provided an invalid value for a parameter',
  InvalidRequestException: 'You provided a parameter value that is not valid for the current state of the resource',
  ResourceNotFoundException: 'Requested secret not found',
  ExpiredTokenException: 'Your credentials expired. Please, re-login'
};

module.exports = async function ({ env, configFile = '.mystiko.json' }) {
  const config = await readConfigFile(env, configFile);
  const { region, secrets = []} = config;
  return await Promise.all(secrets.map(async (secretConfig) => {
    const { name, target } = secretConfig;
    if (!TARGETS.includes(target) && target) {
      const errorMsg = `Secret ${name} is not processed, because its target ${target} is not supported. ` +
      `Supported:${TARGETS.join(',')}`;
      throw new MystikoError(errorMsg);
    }

    const secretValue = await readValue(name, region);
    if (secretValue) await processSecrets(secretValue, secretConfig);
  }));
}

function getTargetValue(secretConfig = {}) {
  if ('filename' in secretConfig) {
    return secretConfig.filename;
  } else if ('envname' in secretConfig) {
    return secretConfig.envname;
  } else {
    const errorMsg = `Unknown type of target: ${target} in ${JSON.stringify(secretConfig)}`;
    logger.error(errorMsg);
    throw new MystikoError(errorMsg);
  }
}

function getTargetFromTargetValueKey(secretConfig = {}) {
  if ('filename' in secretConfig) {
    return 'file';
  } else if ('envname' in secretConfig) {
    return 'env';
  } else {
    const errorMsg = `Missing envname or filename from secret ${JSON.stringify(secretConfig)}`;
    logger.error(errorMsg);
    throw new MystikoError(errorMsg);
  }
}

async function processSecrets(secretValue, secretConfig) {
  if ('keyValues' in secretConfig) {
    const secrets = secretConfig['keyValues'];
    secretValue = safelyParseSecretString(secretValue);
    for (const secret of secrets) {
      if (!(secret.key in secretValue)) {
        const errorMsg = `${secret.key} is not a key in the ASM secret ${secretConfig.name}`;
        throw new MystikoError(errorMsg);
      }
      const target = getTargetFromTargetValueKey(secret);
      await processSecret(secret.key, secretValue[secret.key], target, getTargetValue(secret));
    }
  } else {
    const target = getTargetFromTargetValueKey(secretConfig);
    await processSecret(secretConfig.name, secretValue, target, getTargetValue(secretConfig));
  }
}

async function processSecret(secretName, secretValue, target, targetValue) {
  if (target === 'file') {
    let filePath = targetValue;
    logger.log(`Saving ${secretName} into file ${filePath}`);
    filePath = path.parse(filePath);
    await fs.mkdir(filePath.dir, { recursive: true });
    await fs.writeFile(targetValue, secretValue);
  } else if (target === 'env') {
    logger.log(`Saving ${secretName} into environment variable ${targetValue}`);
    process.env[targetValue] = secretValue;
  } else {
    const errorMsg = `No logic to support target ${target} for ${secretName}`;
    logger.error(errorMsg);
    throw new MystikoError(errorMsg);
  }
}

async function getSecretFromSecretManager(secretName, region) {
  const client = new SecretsManagerClient({
    region: region
  });
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

async function readValue(secretName, region) {
  const [err, data] = await getSecretFromSecretManager(secretName, region);

  if (err) {
    const msg = errorMessages[err.name] || `Unknown error [${err.name}]: ${secretName}`;
    logger.error([`${msg}: ${secretName}\n${err}`]);
    throw err;
  } else {
    return parseSecret(data);
  }
}

function parseSecret (data) {
  // Depending on whether the secret is a string or binary, one of these fields will be populated.
  if ('SecretString' in data) {
    return safelyParseSecretString(data.SecretString);
  } else {
    const buff = Buffer.from(data.SecretBinary, 'base64');
    return buff.toString('utf8');
  }
}

function combineEnvironmentWithDefaults(config, defaults = {secrets: []}) {
  const { secretNamePrefix, ignoreSecretNamePrefix = []} = defaults;
  const secrets = [...config['secrets'], ...defaults['secrets']];

  config['secrets'] = secrets;
  for (secret of secrets) {
    const name = secret['name'];
    // If secret name does not include the ignore list, add the prefix
    if (secretNamePrefix && !ignoreSecretNamePrefix.some(v => name.includes(v))) {
      secret['name'] = `${secretNamePrefix}${name}`;
    }
  }
  return config;
}

async function readConfigFile (env, configFile) {
  let data = await fs.readFile(configFile, 'utf8');
  data = JSON.parse(data);
  validateSchema(data);
  let config;
  try {
    config = data.environments[env];
    return combineEnvironmentWithDefaults(config, data['defaults']);
  } catch (err) {
    throw new ConfigError(`Unable to parse ${configFile}\n` + err.toString());
  }
}

function safelyParseSecretString (string) {
  try {
    return JSON.parse(string);
  } catch (err) { // Plain text secret
    return string;
  }
}

function validateSchema (config) {
  const ajv = new Ajv({allErrors: true});

  const keyValuesSchema = {
    type: 'object',
    properties: {
      key: {type: 'string'},
      target: {type: 'string', enum: ['env', 'file']},
      filename: {type: 'string'},
      envname: {type: 'string'}
    },
    anyOf: [
      {
        required: ['key', 'filename'],
        not: { required: ['envname'] }
      },
      {
        required: ['key', 'envname'],
        not: { required: ['filename'] }
      }
    ],
    dependencies: {
      target: {
        if: {properties: {target:{const: 'env'}}},
        then: {required: ['envname']},
        else: {
          if: {properties: {target:{const: 'file'}}},
          then: {required: ['filename']},
        }
      }
    },
    required: ['key'],
    additionalProperties: false
  };

  const keyValuesArraySchema = {
    type: 'array',
    items: keyValuesSchema
  }

  const secretsSchema = {
    type: 'object',
    properties: {
      name: {type: 'string'},
      target: {type: 'string', enum: ['env', 'file']},
      filename: {type: 'string'},
      envname: {type: 'string'},
      keyValues: keyValuesArraySchema
    },
    anyOf: [
      {
        required: ['name', 'filename'],
        not: {required: ['envname']}
      },
      {
        required: ['name', 'envname'],
        not: {required: ['filename']}
      },
      {
        required: ['name', 'keyValues'],
        not: {required: ['target', 'envname', 'filename']}
      }
    ],
    dependencies: {
      target: {
        if: {properties: {target:{const: 'env'}}},
        then: {required: ['envname']},
        else: {
          if: {properties: {target:{const: 'file'}}},
          then: {required: ['filename']},
        }
      }
    },
    required: ['name'],
    additionalProperties: false
  };

  const secretsArraySchema = {
    type: 'array',
    items: secretsSchema
  };

  const environmentObjectSchema = {
    type: 'object',
    properties: {
      region: {type: 'string'},
      secrets: secretsArraySchema
    },
    required: ['secrets'],
    additionalProperties: false
  };

  const defaultsObjectSchema = {
    type: 'object',
    properties: {
      secretNamePrefix: {type: 'string'},
      ignoreSecretNamePrefix: {type: 'array'},
      region: {type: 'string'},
      secrets: secretsArraySchema
    },
    additionalProperties: false
  };

  const environmentsObjectSchema = {
    type: 'object',
    patternProperties: {
      '.*': environmentObjectSchema
    },
    minProperties: 1,
    additionalProperties: true
  };

  const topLevelSchema = {
    type: 'object',
    properties: {
      defaults: defaultsObjectSchema,
      environments: environmentsObjectSchema
    },
    required: ['environments'],
    additionalProperties: false
  };

  const validate = ajv.compile(topLevelSchema);
  const valid = validate(config);

  if (!valid) {
    throw new SchemaValidationError(`Schema validation failed. Errors: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}
