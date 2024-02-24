# GitHub secrets to environment variables

This Action reads your repository's GitHub Secrets and exports them as environment variables make them available to Actions within your Workflows.

It is possible to control what secrets are imported and how they are exported as environment variables.

- Include or exclude secrets (CSV or Regex)
- Remove or add prefix a all exported environment variables
- Override already existing variables (default is true)

Original credit goes to [oNaiPs](https://github.com/oNaiPs/secrets-to-env-action).

## Node Version

Use `@v1` for NodeJS >= 16 and `@v2` for NodeJS >=20.

## Usage

Add the following action to your workflow:

```yaml
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    secrets: ${{ toJSON(secrets) }}
```

After running this action, subsequent actions will be able to access the repository GitHub secrets as environment variables. Eliminating the need to read Secrets one by one and associating them with the respective environment variable.!

_Note the `secrets` key. It is **mandatory** so the action can read and export the secrets._

### Simple

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v2
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
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    include: MY_SECRET, MY_OTHER_SECRETS_*
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET"
```

To export secrets that start with a given string, you can use `include: PREFIX_.+` or `PREFIX_.*`.

NOTE: If specified secret does not exist, it is ignored.

### Add a prefix to exported secrets

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    prefix: PREFIXED_
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of PREFIXED_MY_SECRET: $PREFIXED_MY_SECRET"
```

### Remove a prefix (Recommended Usage)

Remove a prefix to all exported secrets, if present.

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    exclude: PREFIX2_.+
    remove-prefix: PREFIX1_
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of PREFIX1_MY_SECRET: $MY_SECRET"
```

### Overrides already existing variables (default is **false**)

```yaml
env:
  MY_SECRET: DONT_OVERRIDE
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    override: false
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET"
Value of MY_SECRET: DONT_OVERRIDE
```

### Convert environment variables case

Converts all exported secrets case to `lower` or `upper`. Default is `upper`.

```yaml
steps:
- uses: actions/checkout@v3
- uses: driblash/secrets-to-environment-variables-action@v2
  with:
    convert: lower
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of my_secret: $my_secret"
```

## Contributing

Run `pnpm install`, apply desired changes. When you are done. Open a Pull Request and Request a Review. Before the code is pushed we will run `pnpm validate` to ensure the code is working as intended.
