import {
  extractDependency,
  extractQuotedString,
  hasQuotedString,
  isDependency,
} from "@/utils/pypi";

test.each([
  ["foo==0.9", true],
  ["foo>=0.9", true],
  ['foo = "^0.66.0"', true],
  ["foo~=0.961", true],
  ["foo!=0.961", true],
  ["foo<=0.961", true],
  ["foo<0.961", true],
  ["foo ~= 0.961", true],
  ["foo != 0.961", true],
  ["foo <= 0.961", true],
  ["foo < 0.961 ", true],
])("hasQuotedString", (line, expected) => {
  expect(isDependency(line)).toEqual(expected);
});

test.each([
  ['"foo"', true],
  ["'foo'", true],
  ["foo", false],
])("hasQuotedString", (line, expected) => {
  expect(hasQuotedString(line)).toEqual(expected);
});

test.each([
  ['"autoflake==1.3.1"', "autoflake==1.3.1"],
  ["'autoflake==1.3.1'", "autoflake==1.3.1"],
])("extractDoubleQuotedString", (line, expected) => {
  expect(extractQuotedString(line)).toEqual(expected);
});

test.each([
  ['foo = "^1.0.0"', "foo", "1.0.0"],
  ["foo = 1.0.0", "foo", "1.0.0"],
  ["foo == 1.0.0", "foo", "1.0.0"],
  ["foo ~= 1.0.0", "foo", "1.0.0"],
  ["foo != 1.0.0", "foo", "1.0.0"],
  ["foo <= 1.0.0", "foo", "1.0.0"],
  ["foo < 1.0.0", "foo", "1.0.0"],
  ["foo == 1.*", "foo", "1.*"],
  ["foo == *", "foo", "*"],
  ["foo[extra] == 1.0.0", "foo", "1.0.0"],
  ['foo = {extras = ["extra"], version = "^1.0.0"}', "foo", "1.0.0"],
  ['  "foo==1.0.0", ', "foo", "1.0.0"],
])("extractDependency", (line, name, requirements) => {
  const dependency = extractDependency(line);
  expect(dependency).toBeDefined();
  expect(dependency?.name).toEqual(name);
  expect(dependency?.requirements).toEqual(requirements);
});
