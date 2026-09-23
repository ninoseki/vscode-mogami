import { isValidSpecifier, satisfies, validateRange } from './pypi'

describe('satisfies', () => {
  test.each([
    ['1.0.0', '== 1.0.0', true],
    ['1.0.0', '== 1.0.1', false],
    ['2.0', '~= 2.0', true],
    ['2.0.0', '~= 2.0', true],
    ['2.0', '^2.0', true],
    ['2.0', '^2.0', true],
    ['2.0.0', '^2.0', true],
    ['2.0.0.a1', '>2.0', false],
    ['2.0.0.a1', '<2.0', false],
    ['2.0.0.a1', '~=2.0', true],
  ])('satisfies(%s, %s) === %s', (version: string, specifier: string, expected: boolean) => {
    expect(satisfies(version, { name: 'dummy', specifier })).toBe(expected)
  })
})

describe('validateRange', () => {
  test.each([
    [undefined, false],
    ['1.0.0', false],
    ['==1.0.0', false],
    ['>=1.0.0', true],
    ['~=1.0.0', true],
    ['>=1.0.0,<2.0.0', true],
    ['!=1.0.0', true],
    // invalid ranged version specifier
    ['>=1.0.0 <2.0.0', false],
  ])('validateRange(%s) === %s', (specifier: string | undefined, expected: boolean) => {
    expect(validateRange({ name: 'dummy', specifier })).toBe(expected)
  })
})

describe('isValidSpecifier', () => {
  test.each([
    [undefined, true],
    // bare pin (no operator) - not a valid PEP 440 constraint on its own, but not an
    // attempted-and-broken range either
    ['1.0.0', true],
    ['==1.0.0', true],
    ['>=1.0.0', true],
    ['~=1.0.0', true],
    ['!=1.0.0', true],
    // PEP 440 uses a comma to AND constraints, not a space
    ['>=1.0.0,<2.0.0', true],
    ['>=1.0.0 <2.0.0', false],
    // npm-style operators mistakenly used in a PEP 440 specifier
    ['^1.2.3', false],
    ['~1.2.3', false],
  ])('isValidSpecifier(%s) === %s', (specifier: string | undefined, expected: boolean) => {
    expect(isValidSpecifier({ name: 'dummy', specifier })).toBe(expected)
  })
})
