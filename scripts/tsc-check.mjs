import path from "node:path";
import ts from "typescript";

// Pure TS API runner (no subprocess). Equivalent to: tsc --noEmit
try {
  const cwd = process.cwd();
  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    console.error("tsconfig.json not found in project root.");
    process.exit(2);
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    const host = {
      getCurrentDirectory: () => cwd,
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    };
    console.error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], host),
    );
    process.exit(2);
  }

  // Entferne inkrementelle Build-Flags schon VOR dem Parsen der tsconfig
  const sanitizedConfig = (() => {
    const cfg = { ...configFile.config, compilerOptions: { ...(configFile.config?.compilerOptions ?? {}) } };
    delete cfg.compilerOptions.incremental;
    delete cfg.compilerOptions.tsBuildInfoFile;
    delete cfg.compilerOptions.composite;
    return cfg;
  })();

  const parsed = ts.parseJsonConfigFileContent(
    sanitizedConfig,
    {
      useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
      readDirectory: ts.sys.readDirectory,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
    },
    path.dirname(configPath),
  );

  const compilerOptions = { ...parsed.options, noEmit: true };

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: compilerOptions,
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (!diagnostics.length) {
    console.log("✓ TypeScript: no errors.");
    process.exit(0);
  }

  const formatHost = {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
  );
  process.exit(1);
} catch (err) {
  // Most likely "Cannot find package 'typescript'". Give a clear hint and exit non-zero.
  console.error(
    "TypeScript API runner failed. Ensure 'typescript' is installed (devDependency).",
    "\nError:",
    err?.message || err,
  );
  process.exit(1);
}
