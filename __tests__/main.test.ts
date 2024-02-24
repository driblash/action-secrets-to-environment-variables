/* eslint-disable no-console */
import { expect, jest } from '@jest/globals'
import * as core from '@actions/core'
import main from '../src/main'

jest.mock('@actions/core')

let mockedCore: jest.Mocked<typeof core>

jest.mocked(core.debug).mockImplementation((s) => console.log(`DEBUG: ${s}`))
jest.mocked(core.info).mockImplementation((s) => console.log(`INFO: ${s}`))
jest.mocked(core.warning).mockImplementation((s) => console.log(`WARNING: ${s}`))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mockInputs(inputs: { [key: string]: string }) {
  jest.mocked(core.getInput).mockImplementation((s) => inputs[s] || '')
}

describe('secrets-to-env-action', () => {
  let inputSecrets: { [key: string]: string }
  let newSecrets: { [key: string]: string }

  beforeEach(() => {
    inputSecrets = {
      alice_bob: 'low_value',
      FOO: 'BAR',
      PREFIX_SECRET_1: 'VALUE_1',
      PREFIX_SECRET_2: 'VALUE_2',
      SECRET_1_SUFFIX: 'VALUE_1',
      SECRET_2_SUFFIX: 'VALUE_2',
    }

    newSecrets = {}

    jest.mocked(core.exportVariable).mockImplementation((k, v) => (newSecrets[k] = v))
  })

  describe('when used without options', () => {
    it('exports all secrets as environment variables', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
      })

      await main()

      expect(newSecrets).toEqual(inputSecrets)
    })
  })

  describe('when used with exclusion filters', () => {
    it('excludes a single variable', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: 'alice_bob',
      })

      await main()

      expect(newSecrets['alice_bob']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        FOO: inputSecrets['FOO'],
        PREFIX_SECRET_1: inputSecrets['PREFIX_SECRET_1'],
        PREFIX_SECRET_2: inputSecrets['PREFIX_SECRET_2'],
        SECRET_1_SUFFIX: inputSecrets['SECRET_1_SUFFIX'],
        SECRET_2_SUFFIX: inputSecrets['SECRET_2_SUFFIX'],
      })
    })

    it('excludes many variables by comma separated value', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: 'alice_bob,FOO',
      })

      await main()

      expect(newSecrets['alice_bob']).toBeUndefined()
      expect(newSecrets['FOO']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        PREFIX_SECRET_1: inputSecrets['PREFIX_SECRET_1'],
        PREFIX_SECRET_2: inputSecrets['PREFIX_SECRET_2'],
        SECRET_1_SUFFIX: inputSecrets['SECRET_1_SUFFIX'],
        SECRET_2_SUFFIX: inputSecrets['SECRET_2_SUFFIX'],
      })
    })

    it('excludes many variables by regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: 'SECRET',
      })

      await main()

      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        alice_bob: inputSecrets['alice_bob'],
        FOO: inputSecrets['FOO'],
      })
    })

    it('excludes many variables by suffix regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: '.+_SUFFIX$',
      })

      await main()

      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_2_SUFFIX']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        alice_bob: inputSecrets['alice_bob'],
        FOO: inputSecrets['FOO'],
        PREFIX_SECRET_1: inputSecrets['PREFIX_SECRET_1'],
        PREFIX_SECRET_2: inputSecrets['PREFIX_SECRET_2'],
      })
    })

    it('excludes many variables by prefix regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: '^PREFIX_.+',
      })

      await main()

      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        alice_bob: inputSecrets['alice_bob'],
        FOO: inputSecrets['FOO'],
        SECRET_1_SUFFIX: inputSecrets['SECRET_1_SUFFIX'],
        SECRET_2_SUFFIX: inputSecrets['SECRET_2_SUFFIX'],
      })
    })

    it('does not exclude secrets which do not match a regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        exclude: '^PREFIX_$',
      })

      await main()

      expect(newSecrets).toMatchObject({
        alice_bob: inputSecrets['alice_bob'],
        FOO: inputSecrets['FOO'],
        SECRET_1_SUFFIX: inputSecrets['SECRET_1_SUFFIX'],
        SECRET_2_SUFFIX: inputSecrets['SECRET_2_SUFFIX'],
        PREFIX_SECRET_1: inputSecrets['PREFIX_SECRET_1'],
        PREFIX_SECRET_2: inputSecrets['PREFIX_SECRET_2'],
      })
    })
  })

  describe('when used with inclusion filters', () => {
    it('includes a single variable', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: 'alice_bob',
      })

      await main()

      expect(newSecrets['alice_bob']).toEqual(inputSecrets['alice_bob'])

      expect(newSecrets['FOO']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_2_SUFFIX']).toBeUndefined()
    })

    it('includes many variables by comma separated value', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: 'alice_bob,FOO',
      })

      await main()

      expect(newSecrets['alice_bob']).toEqual(inputSecrets['alice_bob'])
      expect(newSecrets['FOO']).toEqual(inputSecrets['FOO'])

      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_2_SUFFIX']).toBeUndefined()
    })

    it('includes many variables by regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: '_SUFFIX',
      })

      await main()

      expect(newSecrets['SECRET_1_SUFFIX']).toEqual(inputSecrets['SECRET_1_SUFFIX'])
      expect(newSecrets['SECRET_2_SUFFIX']).toEqual(inputSecrets['SECRET_2_SUFFIX'])

      expect(newSecrets['alice_bob']).toBeUndefined()
      expect(newSecrets['FOO']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()
    })

    it('includes many variables by prefix regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: '^PREFIX_.+',
      })

      await main()

      expect(newSecrets['alice_bob']).toBeUndefined()
      expect(newSecrets['FOO']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_2_SUFFIX']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        PREFIX_SECRET_1: inputSecrets['PREFIX_SECRET_1'],
        PREFIX_SECRET_2: inputSecrets['PREFIX_SECRET_2'],
      })
    })

    it('includes many variables by suffix regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: '.+_SUFFIX$',
      })

      await main()

      expect(newSecrets['alice_bob']).toBeUndefined()
      expect(newSecrets['FOO']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()

      expect(newSecrets).toMatchObject({
        SECRET_1_SUFFIX: inputSecrets['SECRET_1_SUFFIX'],
        SECRET_2_SUFFIX: inputSecrets['SECRET_2_SUFFIX'],
      })
    })

    it('does not include secrets which do not match a regex expression', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: '_SPECIAL_SUFFIX$',
      })

      await main()

      expect(newSecrets['alice_bob']).toBeUndefined()
      expect(newSecrets['FOO']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_1']).toBeUndefined()
      expect(newSecrets['PREFIX_SECRET_2']).toBeUndefined()
      expect(newSecrets['SECRET_1_SUFFIX']).toBeUndefined()
      expect(newSecrets['SECRET_2_SUFFIX']).toBeUndefined()

      expect(newSecrets).toMatchObject({})
    })
  })

  it('adds a prefix', async () => {
    const prefix = 'ABC_'

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      'add-prefix': prefix,
    })

    await main()

    const actual = Object.keys(newSecrets).every((value) => value.startsWith(prefix))

    expect(actual).toBe(true)
  })

  it('adds a suffix', async () => {
    const suffix = '_ABC'

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      'add-suffix': suffix,
    })

    await main()

    const actual = Object.keys(newSecrets).every((value) => value.endsWith(suffix))

    expect(actual).toBe(true)
  })

  it('removes a prefix', async () => {
    const prefix = 'PREFIX_'

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      'remove-prefix': prefix,
    })

    await main()

    const actual = Object.keys(newSecrets).some((value) => value.startsWith(prefix))

    expect(actual).toBe(false)

    expect(newSecrets['SECRET_1']).toEqual(inputSecrets['PREFIX_SECRET_1'])
    expect(newSecrets['SECRET_2']).toEqual(inputSecrets['PREFIX_SECRET_2'])
  })

  it('removes a suffix', async () => {
    const suffix = '_SUFFIX'

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      'remove-suffix': suffix,
    })

    await main()

    const actual = Object.keys(newSecrets).some((value) => value.endsWith(suffix))

    expect(actual).toBe(false)

    expect(newSecrets['SECRET_1']).toEqual(inputSecrets['SECRET_1_SUFFIX'])
    expect(newSecrets['SECRET_2']).toEqual(inputSecrets['SECRET_2_SUFFIX'])
  })

  describe('when case there are case transformations to be applied', () => {
    it('converts key to lower case when convert is `lower`', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        convert: 'lower',
        tracelog: 'true',
      })

      await main()

      expect(newSecrets['foo']).toBeDefined()
      expect(newSecrets['FOO']).toBeUndefined()
    })

    it('converts key to uppercase when convert is `upper`', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        convert: 'upper',
      })

      await main()

      expect(newSecrets['ALICE_BOB']).toBeDefined()
      expect(newSecrets['alice_bob']).toBeUndefined()
    })
  })

  describe('override behaviour', () => {
    it('sets the variables if they are not present in the running process', async () => {
      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: 'FOO',
        override: 'true',
      })

      await main()

      expect(newSecrets['FOO']).toBeDefined()
      expect(newSecrets['FOO']).toEqual(inputSecrets['FOO'])
    })

    it('overrides the value present in the running process when override is `true`', async () => {
      process.env = {
        FOO: 'OVERRIDE',
      }

      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: 'FOO',
        override: 'true',
      })

      await main()

      expect(newSecrets['FOO']).toBeDefined()
      expect(newSecrets['FOO']).toEqual(inputSecrets['FOO'])
    })

    it('preserves the value present in the running process when override is `false`', async () => {
      process.env = {
        FOO: 'GARGULA',
      }

      mockInputs({
        secrets: JSON.stringify(inputSecrets),
        include: 'FOO',
        override: 'false',
      })

      await main()

      expect(newSecrets['FOO']).toBeUndefined()
    })
  })
})
