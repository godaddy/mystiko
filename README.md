# Mystiko

Exposes secrets from AWS Secrets Manager in a variety ways so they can be used by your build process, CICD, or application runtime.
Only `string` and `JSON as string` type secrets from AWS Secrets Manager are supported

## Usage

1. Create file `.mystiko.json` in folder where you run it with below syntax. See `example` folder or below JSON
Every secret can have:

1) `env` target, so it is saved as `envname` into `process.env` object
2) `file` target, so it is saved under `filename` path in file system (absolute or relative to current folder)
3) have `keyValues` property instead of target, which means Secret is a JSON object itself and every property in it should be treated as separate secret with own config as in 1) or 2) option above

```json
{
  "environments": {
    "<any_env_name>": {
      "region": "<AWS Region,e.g. me-south-1>",
      "secrets": [
        { 
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "target": "env",
          "envname": "<name of env variable to put secret value to>"
        },
        {
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "keyValues": [
            { 
              "key": "<key in AWS Secret>",
              "target": "file",
              "filename": "<relative or absolute path of target file to put secret value to>"
            }
          ]
        }
      ]
    }
  }
}
```

2. Call mystiko anywhere you want to add your secrets

The `mystiko` function is async since calls to AWS Secrets Manager to fetch secrets are async. It can be consumed using `await` or `.then()`.
n.b. `mystiko` uses standard AWS IAM authentication [see Configuration settings and precedence ](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) to access Secrets Manager.

```javascript
/* Use import */
import mystiko from 'mystiko';
/* Use require */
const mystiko = require('mystiko');
/* Use await */
await mystiko({ env: 'dev' });
// Secrets are now available
/* Use .then() */
mystiko({ env: 'dev' }).then(() => {
  // Secrets are now available
});
```

3. Use your Secret
Depending on your `.mystiko.json` configuration, your secrets will now be stored in the `process.env` object or saved in files.


## Tests

Run tests with `npm run test`. When adding a new feature, make sure the code coverage does not go down.

## Questions?

Slack: https://godaddy-oss.slack.com/
