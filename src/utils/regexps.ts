export const pypiDependencyRegexp =
  /^([a-zA-z0-9-_]+)\s*(=|>|<|!|~)+\s*.+["|']?\^*([0-9.]+)["|']?.+/;
export const pypiPackageNameRegexp = /^([a-zA-z0-9-_]+)\s*(=|>|<|!|~)+\s*/;
export const pypiPackageRequirementsRegexp = /["|']?\^*([0-9.*]+)["|']?/;

export const gemfileLockRegexp = /\b.+\(.+\)/;
export const gemfileRegexp = /\bgem( |"|')/;
export const gemspecRegexp =
  /\b\w+\.(add_development_dependency|add_runtime_dependency|add_dependency)/;

export const bracketsRegexp = /\[[a-zA-z0-9-_]+\]/;
export const quotedStringRegexp = /^["|'](.*?)["|'],?$/;
