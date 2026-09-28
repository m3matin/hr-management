const { fileURLToPath } = require("node:url");

const INLINE_SOURCE_MAP_PATTERN =
  /(\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,)([A-Za-z0-9+/=]+)(\s*)$/;

function normalizeWindowsSourceMap(code) {
  if (process.platform !== "win32") {
    return code;
  }

  const match = INLINE_SOURCE_MAP_PATTERN.exec(code);
  if (!match) {
    return code;
  }

  const sourceMap = JSON.parse(
    Buffer.from(match[2], "base64").toString("utf8"),
  );

  if (!Array.isArray(sourceMap.sources)) {
    return code;
  }

  const normalizedSources = sourceMap.sources.map((source) =>
    source.startsWith("file:") ? fileURLToPath(source) : source,
  );

  if (
    normalizedSources.every(
      (source, index) => source === sourceMap.sources[index],
    )
  ) {
    return code;
  }

  sourceMap.sources = normalizedSources;
  const encodedSourceMap = Buffer.from(JSON.stringify(sourceMap)).toString(
    "base64",
  );

  return `${code.slice(0, match.index)}${match[1]}${encodedSourceMap}${match[3]}`;
}

module.exports = {
  afterProcess(_transformArguments, compiledOutput) {
    return {
      ...compiledOutput,
      code: normalizeWindowsSourceMap(compiledOutput.code),
    };
  },
};
