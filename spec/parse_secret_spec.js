const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const parseSecret = mystiko.__get__('parseSecret');

describe('Parse Secret', function() {
  it('should retrieve a plain text secret', function() {
    const data = {
      'SecretString': 'youcantseeme'
    }
    const secret = parseSecret(data)
    expect(secret).toBe('youcantseeme');
  });

  it('should retrieve key/value pair secret with multiple keys', function() {
    const data = {
      'SecretString': {
        'secret1': 'secretvalue1',
        'secret2': 'secretvalue2'
      }
    }
    const secret = parseSecret(data)
    expect(secret.secret1).toBe('secretvalue1');
    expect(secret.secret2).toBe('secretvalue2');
  });

  it('should retrieve a binary secret', function() {
    const data = {
      'SecretBinary': Buffer.from('secret value').toString('base64')
    }
    const secret = parseSecret(data)
    expect(secret).toBe('secret value');
  });
});
