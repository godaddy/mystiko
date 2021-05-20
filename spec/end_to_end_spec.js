const sinon = require('sinon');
const fs = require('fs/promises');
const rewire = require('rewire');
const mystiko = rewire('../src/index.js');

describe('End to End Test', function() {
  const EXPECTED_SECRET1_VALUE = 'SUPER SECRET VALUE1';
  const EXPECTED_SECRET2_VALUE = 'SUPER SECRET VALUE2';
  const CERT_FILE = './test_gen_files/cert.crt';
  const EXPECTED_SECRET3_VALUE = 'FILE SECRET VALUE3';
  let getSecretFromSecretManagerStub;

  beforeAll(function() {
    const getSecretFromSecretManager = { getSecretFromSecretManager: mystiko.__get__('getSecretFromSecretManager') };
    getSecretFromSecretManagerStub = sinon.stub(getSecretFromSecretManager, 'getSecretFromSecretManager');
  });

  beforeEach(function() {
    delete process.env.SECRET_KEY1_ENV;
    delete process.env.SECRET_KEY2_ENV;
    if (fs.exists(CERT_FILE)) {
      fs.unlink(CERT_FILE);
    }
  });

  it('should run mystiko app and set all key/values secrets as environment variables/file', async function() {
    const secretString = `{
      "SECRET_KEY1": "SUPER SECRET VALUE1",
      "SECRET_KEY2": "SUPER SECRET VALUE2",
      "SECRET_KEY3": "FILE SECRET VALUE3"
    }`;
    getSecretFromSecretManagerStub.resolves([
      null, { 'SecretString':  secretString }
    ]);
    mystiko.__set__('getSecretFromSecretManager', getSecretFromSecretManagerStub);

    await mystiko({ env: 'test', configFile: './spec/fixtures/.mystiko_end_to_end.json'});
    expect(process.env.SECRET_KEY1_ENV).toEqual(EXPECTED_SECRET1_VALUE);
    expect(process.env.SECRET_KEY2_ENV).toEqual(EXPECTED_SECRET2_VALUE);
    const crt = fs.readFile(CERT_FILE, 'utf8');
    expect(crt).toEqual(EXPECTED_SECRET3_VALUE);
  });

  it('should run mystiko app and set plain string text as environment variable', async function() {
    getSecretFromSecretManagerStub.resolves([
      null, { 'SecretString':  'SUPER SECRET VALUE1' }
    ]);
    mystiko.__set__('getSecretFromSecretManager', getSecretFromSecretManagerStub);

    await mystiko({ env: 'test', configFile: './spec/fixtures/.mystiko_end_to_end_nonkeyvalue.json'});
    expect(process.env.SECRET_KEY1_ENV).toEqual(EXPECTED_SECRET1_VALUE);
  });

  it('should run mystiko app and throw error for key not found in ASM secret', async function() {
    const secretString = `{
      "SECRET_KEY1": "SUPER SECRET VALUE1",
      "SECRET_KEY3": "SUPER SECRET VALUE3"
    }`;
    getSecretFromSecretManagerStub.resolves([
      null, { 'SecretString': secretString }
    ]);
    mystiko.__set__('getSecretFromSecretManager', getSecretFromSecretManagerStub);

    let errorMsg = '';
    try {
      await mystiko({ env: 'test', configFile: './spec/fixtures/.mystiko_additional_key.json'});
    } catch (e) {
      errorMsg = e.message;
    }
    const expectedError = 'SECRET_KEY2 is not a key in the ASM secret KEY_VALUE_SECRET1';
    expect(errorMsg).toEqual(expectedError);
    expect('SECRET_KEY2_ENV' in process.env).toEqual(false);
  });
});
