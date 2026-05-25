import { ok } from 'neverthrow'

import { DependencyType, PackageType, SatisfiesFnType } from '@/schemas'
import { satisfies, validateRange } from '@/versioning/utils'

import { createPackageSuggestions, PackageSuggestion } from './utils'

describe('createPackageSuggestions', () => {
  test.each([
    // latest & fixed specifier
    [
      { name: 'foo', specifier: '1.0.0' } as DependencyType,
      { name: 'foo', version: '1.0.0', versions: ['1.0.0'] } as PackageType,
      satisfies,
      [{ title: '🟢 latest 1.0.0', command: '' }] as PackageSuggestion[],
    ],
    // outdated & fixed specifier
    [
      { name: 'foo', specifier: '1.0.0' } as DependencyType,
      { name: 'foo', version: '2.0.0', versions: ['2.0.0'] } as PackageType,
      satisfies,
      [
        { title: '🟡 fixed 1.0.0', command: '' },
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest 2.0.0',
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (satisfies)
    [
      { name: 'foo', specifier: '>=1.0.0' } as DependencyType,
      {
        name: 'foo',
        version: '2.0.0',
        versions: ['2.0.0', '1.0.0'],
      } as PackageType,
      satisfies,
      [
        {
          command: '',
          title: '🟡 satisfies latest 2.0.0',
        },
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest 2.0.0',
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (un-satisfies)
    [
      { name: 'foo', specifier: '>=1.0.0,<2.0.0' } as DependencyType,
      {
        name: 'foo',
        version: '2.0.0',
        versions: ['2.0.0', '1.0.0'],
      } as PackageType,
      satisfies,
      [
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest 2.0.0',
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (satisfies version equals pinned version, no bump)
    [
      { name: 'foo', specifier: '^1.1.0' } as DependencyType,
      {
        name: 'foo',
        version: '2.0.0',
        versions: ['2.0.0', '1.1.0', '1.0.0'],
      } as PackageType,
      satisfies,
      [
        {
          command: '',
          title: '🟡 satisfies 1.1.0',
        },
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest 2.0.0',
        },
      ] as PackageSuggestion[],
    ],
    // current version is higher than the found "latest" (reject lower as latest)
    [
      { name: 'foo', specifier: '2.0.0' } as DependencyType,
      { name: 'foo', version: '1.0.0', versions: ['1.0.0'] } as PackageType,
      satisfies,
      [{ title: '🟡 fixed 2.0.0', command: '' }] as PackageSuggestion[],
    ],
    // current version is higher than the found "latest" with a range specifier
    [
      { name: 'foo', specifier: '^2.0.0' } as DependencyType,
      { name: 'foo', version: '1.0.0', versions: ['1.0.0'] } as PackageType,
      satisfies,
      [] as PackageSuggestion[],
    ],
    // outdated & range specifier (un-satisfies & has newer version)
    [
      { name: 'foo', specifier: '>=1.0.0 <2.0.0' } as DependencyType,
      {
        name: 'foo',
        version: '2.0.0',
        versions: ['2.0.0', '1.1.0', '1.0.0'],
      } as PackageType,
      satisfies,
      [
        {
          command: '',
          title: '🟡 satisfies 1.1.0',
        },
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest 2.0.0',
        },
        {
          command: 'vscode-mogami.suggestions.bumpDependencyClick',
          replaceable: true,
          title: '↑ bump 1.1.0',
        },
      ] as PackageSuggestion[],
    ],
    // SHA-pinned with versionByAlias resolving to the latest tag
    [
      { name: 'actions/cache', specifier: 'a'.repeat(40) } as DependencyType,
      {
        name: 'actions/cache',
        version: 'v5.0.5',
        versions: ['v5.0.5'],
        alias: 'a'.repeat(40),
        versionByAlias: { ['a'.repeat(40)]: 'v5.0.5' },
      } as PackageType,
      satisfies,
      [{ title: '🟢 latest v5.0.5', command: '' }] as PackageSuggestion[],
    ],
    // SHA-pinned to the latest, but versionByAlias records a moving major
    // tag for the same SHA (e.g. `v4` shares the SHA with `v4.2.0`).
    // Alias equality on the raw SHA must short-circuit to "latest".
    [
      { name: 'docker/login-action', specifier: 'a'.repeat(40) } as DependencyType,
      {
        name: 'docker/login-action',
        version: 'v4.2.0',
        versions: ['v4.2.0'],
        alias: 'a'.repeat(40),
        versionByAlias: { ['a'.repeat(40)]: 'v4' },
      } as PackageType,
      satisfies,
      [{ title: '🟢 latest v4.2.0', command: '' }] as PackageSuggestion[],
    ],
    // SHA-pinned with versionByAlias resolving to an older tag
    [
      { name: 'actions/cache', specifier: 'c'.repeat(40) } as DependencyType,
      {
        name: 'actions/cache',
        version: 'v5.0.5',
        versions: ['v5.0.5'],
        alias: 'b'.repeat(40),
        versionByAlias: { ['b'.repeat(40)]: 'v5.0.5', ['c'.repeat(40)]: 'v5.0.4' },
      } as PackageType,
      satisfies,
      [
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest v5.0.5',
        },
      ] as PackageSuggestion[],
    ],
    // SHA-pinned but specifier missing from versionByAlias — treated as outdated
    [
      { name: 'actions/cache', specifier: 'e'.repeat(40) } as DependencyType,
      {
        name: 'actions/cache',
        version: 'v5.0.5',
        versions: ['v5.0.5'],
        alias: 'd'.repeat(40),
        versionByAlias: { ['d'.repeat(40)]: 'v5.0.5' },
      } as PackageType,
      satisfies,
      [
        {
          command: 'vscode-mogami.suggestions.updateDependencyClick',
          replaceable: true,
          title: '↑ latest v5.0.5',
        },
      ] as PackageSuggestion[],
    ],
  ])(
    'createPackageSuggestions(%s, %s, %s) === %s',
    (
      dependency: DependencyType,
      pkg: PackageType,
      satisfies: SatisfiesFnType,
      expected: PackageSuggestion[],
    ) => {
      const pkgResult = ok(pkg) // eslint-disable-line neverthrow/must-use-result
      expect(
        createPackageSuggestions({
          dependency,
          pkgResult,
          satisfies,
          validateRange,
        }),
      ).toEqual(expected)
    },
  )
})
