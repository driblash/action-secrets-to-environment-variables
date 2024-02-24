import * as core from '@actions/core'

export default async function run(): Promise<void> {
  let excludeList = [
    // this variable is already exported automatically
    'github_token',
  ]

  try {
    const secretsJson: string = core.getInput('secrets', { required: true })
    const keyPrefix: string = core.getInput('prefix')
    const includeListStr: string = core.getInput('include')
    const excludeListStr: string = core.getInput('exclude')
    const convertStr: string = core.getInput('convert')
    const convert = convertStr.length ? convertStr : 'upper'
    const overrideStr: string = core.getInput('override')
    const override = overrideStr.length ? overrideStr === 'true' : false
    const removePrefix: string = core.getInput('removeprefix')
    const traceLogStr: string = core.getInput('tracelog')
    const traceLog = traceLogStr.length ? traceLogStr === 'true' : false

    let secrets: Record<string, string>
    try {
      secrets = JSON.parse(secretsJson)
    } catch (e) {
      throw new Error(`Cannot parse JSON secrets.
Make sure you add the following to this action:

with:
      secrets: \${{ toJSON(secrets) }}
or:
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

    if (traceLog) {
      core.debug(`Using include list: ${includeList?.join(', ')}`)
      core.debug(`Using exclude list: ${excludeList.join(', ')}`)
      core.debug(`Adding prefix: ${keyPrefix}`)
      core.debug(`Removing prefix: ${removePrefix}`)
      core.debug(`Override: ${override}`)
      core.debug(`Convert: ${convert}`)
    }

    for (const key of Object.keys(secrets)) {
      if (includeList && !includeList.some((inc) => key.match(new RegExp(inc)))) {
        if (traceLog) core.info(`excluding ${key} as not in includelist`)
        continue
      }

      if (excludeList.some((inc) => key.match(new RegExp(inc)))) {
        if (traceLog) core.debug(`excluding ${key} as in excludelist`)
        continue
      }

      let newKey = key
      if (removePrefix.length && key.startsWith(removePrefix)) {
        if (traceLog) core.debug(`removing prefix from ${key}`)
        newKey = key.slice(removePrefix.length)
        if (traceLog) core.debug(`prefix removal ${key} -> ${newKey}`)
      } else if (keyPrefix.length) {
        if (traceLog) core.debug(`adding prefix to ${key}`)
        newKey = `${keyPrefix}${key}`
        if (traceLog) core.debug(`prefix add ${key} -> ${newKey}`)
      }

      if (convert.length) {
        if (convert === 'lower') {
          newKey = newKey.toLowerCase()
        } else {
          newKey = newKey.toUpperCase()
        }
      }

      if (process.env[newKey]) {
        if (override) {
          core.warning(`Will re-write "${newKey}" environment variable.`)
        } else {
          core.info(`Skip overwriting secret ${newKey}`)
          continue
        }
      }

      core.exportVariable(newKey, secrets[key])
      core.info(`Exported envvar -> ${newKey}`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

if (require.main === module) {
  run()
}
