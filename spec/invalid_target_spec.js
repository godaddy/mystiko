const mystiko = require('../src/index.js');

describe('Invalid Target', function() {
  it('should throw an error if the target is not valid', async function() {
    let passed = false;
    try {
      await mystiko({ env: 'test', configFile: './spec/fixtures/.mystiko_invalid_target.json'});
      passed = true;
    } catch (e) {
      const expectedErrorMessage = `should match pattern \\"^(file|env)$\\"`;
      expect(e.message).toContain(expectedErrorMessage);
    }
    expect(passed).toEqual(false);
  });
});
