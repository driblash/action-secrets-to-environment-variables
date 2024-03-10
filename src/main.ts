import * as core from '@actions/core'

function log(level: 'debug' | 'info' | 'warning', ...args: string[]): void {
  const traceLogValue: string = core.getInput('tracelog')
  const traceLog = traceLogValue.length ? traceLogValue === 'true' : false

  if (!traceLog) {
    return
  }

  for (const msg of args) {
    core[level](msg)
  }
}

function debug(...args: string[]): void {
  log('debug', ...args)
}

function info(...args: string[]): void {
  log('info', ...args)
}

function warning(...args: string[]): void {
  log('warning', ...args)
}

export default async function run(): Promise<void> {
  // this variable is already exported automatically
  let excludeList = ['github_token']

  try {
    const convert = core.getInput('convert')
    const excludeListStr: string = core.getInput('exclude')
    const includeListStr: string = core.getInput('include')
    const addPrefix: string = core.getInput('add-prefix')
    const addSuffix: string = core.getInput('add-suffix')
    const removePrefix: string = core.getInput('remove-prefix')
    const removeSuffix: string = core.getInput('remove-suffix')
    const override: boolean = core.getInput('override') === 'true'
    const secretsJson: string = core.getInput('secrets', { required: true })

    let secrets: Record<string, string>

    try {
      secrets = JSON.parse(secretsJson)
    } catch (e) {
      throw new Error(`
        Cannot parse JSON secrets. Are you running our action with "secrets" OR "vars" key value pair?

        - uses: driblash/secrets-to-environment-variables-action@v1
        with:
          secrets: \${{ toJSON(secrets) }}

        - uses: driblash/secrets-to-environment-variables-action@v1
          with:
          secrets: \${{ toJSON(vars) }}
      `)
    }

    let includeList: string[] | null = null

    if (includeListStr.length) {
      includeList = includeListStr.split(',').map((key) => key.trim())
    }

    if (excludeListStr.length) {
      excludeList = excludeList.concat(
        excludeListStr.split(',').map((key) => key.trim()),
      )
    }

    info(
      `Using include list: ${includeList?.join(', ')}`,
      `Using exclude list: ${excludeList.join(', ')}`,
      `Adding prefix: ${addPrefix}`,
      `Adding suffix: ${addPrefix}`,
      `Removing prefix: ${removePrefix}`,
      `Removing suffix: ${addPrefix}`,
      `Override: ${override}`,
      `Convert: ${convert}`,
    )

    for (const key of Object.keys(secrets)) {
      if (includeList && !includeList.some((inc) => key.match(new RegExp(inc)))) {
        debug(`Will exclude ${key} as not in includelist`)

        continue
      }

      if (excludeList.some((inc) => key.match(new RegExp(inc)))) {
        debug(`Will exclude ${key} as in excludelist`)

        continue
      }

      let newKey = key

      if (removePrefix.length && key.startsWith(removePrefix)) {
        debug(`Will remove prefix from ${key}`)

        newKey = key.slice(removePrefix.length)

        debug(`Prefix removed from ${key} -> ${newKey}`)
      }

      if (removeSuffix.length && key.endsWith(removeSuffix)) {
        debug(`Will remove suffix from ${key}`)

        newKey = key.slice(0, -removeSuffix.length)

        debug(`Suffix removed from ${key} -> ${newKey}`)
      }

      if (addPrefix.length) {
        debug(`Will add prefix to ${key}`)

        newKey = `${addPrefix}${key}`

        debug(`Prefix added to ${key} -> ${newKey}`)
      }

      if (addSuffix.length) {
        debug(`Will add suffix to ${key}`)

        newKey = `${key}${addSuffix}`

        debug(`Suffix added to ${key} -> ${newKey}`)
      }

      if (convert === 'lower') {
        newKey = newKey.toLowerCase()
      }

      if (convert === 'upper') {
        newKey = newKey.toUpperCase()
      }

      const isUnset =
        typeof process.env[newKey] === 'undefined' || process.env[newKey] === ''

      if (isUnset) {
        core.exportVariable(newKey, secrets[key])

        core.info(`Exported environment variable: ${newKey}`)

        continue
      }

      if (override) {
        warning(`Will override "${newKey}" environment variable.`)

        core.exportVariable(newKey, secrets[key])

        continue
      }

      warning(`Key "${newKey}" is already set. Will not override environment variable.`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

if (require.main === module) {
  run()
}
