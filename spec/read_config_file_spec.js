const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const readConfigFile = mystiko.__get__('readConfigFile');

describe('Read Config File', function() {
  it('should be able to read the environment config from the config file', async function() {
    const config = await readConfigFile('test', './spec/fixtures/.mystiko.json');
    const expected_config = {
      'region': 'me-south-1',
      'secrets': [{
        'name': 'KEY_VALUE_SECRET1',
        'keyValues': [{
          'key': 'SECRET_KEY1',
          'target': 'env',
          'envname': 'SECRET_KEY1_ENV'
        }, {
          'key': 'SECRET_KEY2',
          'target': 'env',
          'envname': 'SECRET_KEY2_ENV'
        }, {
          'key': 'SECRET_KEY3',
          'target': 'file',
          'filename': './test_gen_files/cert.crt'
        }]
      }, {
        'name': 'NON_KEY_VALUE_SECRET1',
        'target': 'env',
        'envname': 'SECRET_KEY3_ENV'
      }, {
        'name': 'NON_KEY_VALUE_SECRET2',
        'target': 'file',
        'filename': './test_gen_files/cert2.crt'
      }]
    };
    expect(config).toEqual(expected_config);
  });

  it('should be able to read the config and combine the defaults to the environment', async function() {
    const config = await readConfigFile('local', './spec/fixtures/.mystiko_defaults.json');
    const expected_config = {
      'region': 'us-west-2',
      'secrets': [
        {
          'name': '/App/HelloWorld/local_cert.key',
          'target': 'file',
          'filename': './certs/local_cert.key'
        },
        {
          'name': '/App/HelloWorld/local_cert.crt',
          'target': 'file',
          'filename': './certs/local_cert.crt'
        },
        {
          'name': '/Shared/essp',
          'target': 'env',
          'envname': 'ESSP_ENV_VARIABLE'
        },
        {
          'name': '/App/HelloWorld/DEFAULT_ADD_PREFIX',
          'target': 'env',
          'envname': 'DEFAULT_SECRET_ENV'
        },
        {
          'name': '/Shared/DEFAULT_IGNORE_PREFIX',
          'target': 'env',
          'envname': 'DEFAULT_SECRET_ENV2'
        }
      ]
    };
    expect(config).toEqual(expected_config);
  });
});
