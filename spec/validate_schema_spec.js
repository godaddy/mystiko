const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const validateSchema = mystiko.__get__('validateSchema');
const fs = require('fs/promises');

describe('Validate Schema', function() {
  it('should validate the schema is correct', async function() {
    const config = await fs.readFile('./spec/fixtures/.mystiko_schema_validation.json', 'utf8');
    validateSchema(JSON.parse(config));
  });

  it('should validate the schema is correct without target', async function() {
    const config = await fs.readFile('./spec/fixtures/.mystiko_schema_validation_no_target.json', 'utf8');
    validateSchema(JSON.parse(config));
  });
});
