const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const processSecrets = mystiko.__get__('processSecrets');
const fs = require('fs/promises');

describe('Process Secret', function() {
  const TEST_FILE_SECRET = './test_gen_files/test_file';

  beforeEach(async function() {
    delete process.env.PLAIN_TEXT_SECRET;
    delete process.env.SECRET_KEY1_ENV;
    delete process.env.SECRET_KEY2_ENV;
    try {
      await fs.unlink(TEST_FILE_SECRET);
    } catch (err) {
      // Ignore
    }
  });

  it('should be able to set a plain text secret as an environment variable', async function() {
    const secretConfig = { 'name': 'ASM_SECRET_NAME2', 'target': 'env', 'envname': 'PLAIN_TEXT_SECRET' };
    const secretValue = 'secret value';
    await processSecrets(secretValue, secretConfig);
    expect(process.env.PLAIN_TEXT_SECRET).toBe(secretValue);
  });

  it('should be able to set multiple key/values in a single secret as environment variables', async function() {
    const secretValue = '{ "SECRET_KEY1": "secretvalue1", "SECRET_KEY2": "secretvalue2" }'
    const secretConfig = {
      'name': 'KEY_VALUE_SECRET1',
      'keyValues': [
        { 'key': 'SECRET_KEY1', 'target': 'env', 'envname': 'SECRET_KEY1_ENV' },
        { 'key': 'SECRET_KEY2', 'target': 'env', 'envname': 'SECRET_KEY2_ENV' }
      ]
    }
    await processSecrets(secretValue, secretConfig);
    expect(process.env.SECRET_KEY1_ENV).toEqual('secretvalue1');
    expect(process.env.SECRET_KEY2_ENV).toEqual('secretvalue2');
  });

  it('should be able to create a file from a secret', async function() {
    const secretValue = '{ "SECRET_KEY1": "MY SECRET FILE TEXT" }'
    const secretConfig = {
      'name': 'KEY_VALUE_SECRET1',
      'keyValues': [
        { 'key': 'SECRET_KEY1', 'target': 'file', 'filename': TEST_FILE_SECRET },
      ]
    }
    await processSecrets(secretValue, secretConfig);
    const testFileContents = fs.readFile(TEST_FILE_SECRET, 'utf8');
    expect(testFileContents).toEqual('MY SECRET FILE TEXT');
  });
});
