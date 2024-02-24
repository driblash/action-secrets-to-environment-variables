# GitHub secrets to environment variables

This Action reads your repository's GitHub Secrets and exports them as environment variables make them available to Actions within your Workflows.

It is possible to control what secrets are imported and how they are exported as environment variables.

- Include or exclude secrets (CSV or Regex)
- Add prefix to all exported environment variables
- Add suffix to all exported environment variables
- Remove prefix from all exported environment variables
- Remove suffix from all exported environment variables
- Override already existing variables (default is true)

Original credit goes to [oNaiPs](https://github.com/oNaiPs/secrets-to-env-action).

## Usage

Add the following action to your workflow:

```yaml
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
```

After running this action, subsequent actions will be able to access the repository GitHub secrets as environment variables. Eliminating the need to read Secrets one by one and associating them with the respective environment variable.!

_Note the `secrets` key. It is **mandatory** so the action can read and export the secrets._

### Simple

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET"
```

### Exclude secret(s) from list of secrets (CSV or Regular Expression)

Exclude defined secret(s) from list of secrets (comma separated, supports regex).

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: driblash/secrets-to-env-action@v1
    with:
      exclude: DUMMY_.+
      secrets: ${{ toJSON(secrets) }}
    # DUMMY_* IS NOT SUPPORTED
```

### Include secret(s) from list of secrets (CSV or Regular Expression)

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    include: MY_SECRET, MY_OTHER_SECRETS_*
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET"
```

To export secrets that start with a given string, you can use `include: PREFIX_.+` or `PREFIX_.*`.

NOTE: If specified secret does not exist, it is ignored.

### Prefixing and Suffixing

It is possible to add and remove prefixes and suffixes from all the secrets found by this action. Refer to [Processing Algorithm](#algorithm-pipeline)

#### Add a prefix to exported secrets

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    add-prefix: PREFIX_
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $PREFIX_MY_SECRET"
```

#### Add a suffix to exported secrets

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    add-suffix: _SUFFIX
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET_SUFFIX"
```

#### Remove a prefix

Remove a prefix to all exported secrets, if present.

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    remove-prefix: PREFIX_
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of PREFIX_MY_SECRET: $MY_SECRET"
```

#### Remove a suffix

Remove a prefix to all exported secrets, if present.

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    remove-suffix: _SUFFIX
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET_SUFFIX: $MY_SECRET"
```

### Overrides already existing variables (default is **false**)

```yaml
env:
  MY_SECRET: DONT_OVERRIDE
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    override: true
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET" # possibly another value
```

### Convert environment variables case

Converts all exported secrets case to `lower` or `upper`. Default is `upper`.

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v1
  with:
    convert: lower
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of my_secret: $my_secret"
```

## Contributing

Run `pnpm install`, apply desired changes. When you are done. Open a Pull Request and Request a Review. Before the code is pushed we will run `pnpm validate` to ensure the code is working as intended.

## Algorithm Pipeline

This can be seen as a pipeline of changes in the following order:

- Read all secrets
- Apply inclusion filter
- Apply exclusion filter
- For all Keys repeat
  - Clone original Secret key
  - Remove prefix from cloned key if present
  - Remove suffix from cloned key if present
  - Add prefix to cloned key
  - Add suffix to cloned key
  - Convert case if applicable
  - Set Key unless key already exist and override is false
  - Export cloned key as an environment variable with its associated value
