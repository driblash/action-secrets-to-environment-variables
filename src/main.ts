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
    const convertStr: string = core.getInput('convert')
    const overrideStr: string = core.getInput('override')

    const convert = convertStr.length ? convertStr : 'upper'
    const excludeListStr: string = core.getInput('exclude')
    const includeListStr: string = core.getInput('include')
    const keyPrefix: string = core.getInput('prefix')
    const override = overrideStr.length ? overrideStr === 'true' : false
    const removePrefix: string = core.getInput('removeprefix')
    const secretsJson: string = core.getInput('secrets', { required: true })

    let secrets: Record<string, string>

    try {
      secrets = JSON.parse(secretsJson)
    } catch (e) {
      throw new Error(`
        Cannot parse JSON secrets. Are you running our action with "secrets" OR "vars" key value pair?

        - uses: driblash/secrets-to-environment-variables-action@v2
        with:
          secrets: \${{ toJSON(secrets) }}

        - uses: driblash/secrets-to-environment-variables-action@v2
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
      `Adding prefix: ${keyPrefix}`,
      `Removing prefix: ${removePrefix}`,
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
      } else if (keyPrefix.length) {
        debug(`Will add prefix to ${key}`)

        newKey = `${keyPrefix}${key}`

        debug(`Prefix added to ${key} -> ${newKey}`)
      }

      if (convert.length) {
        newKey = convert === 'lower' ? newKey.toLowerCase() : newKey.toUpperCase()
      }

      if (process.env[newKey]) {
        if (override) {
          warning(`Will override "${newKey}" environment variable.`)
        } else {
          info(`Will not override secret ${newKey}`)

          continue
        }
      }

      core.exportVariable(newKey, secrets[key])

      core.info(`Exported environment variable: ${newKey}`)
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
