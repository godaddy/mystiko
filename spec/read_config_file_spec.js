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
});
