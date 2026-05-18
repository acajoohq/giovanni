const {
  createRunOncePlugin,
  withAppBuildGradle,
  withMainApplication,
  withSettingsGradle,
} = require('@expo/config-plugins');

const pkg = require('./package.json');

const settingsLines = [
  "include ':onnxruntime-react-native'",
  "project(':onnxruntime-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/onnxruntime-react-native/android')",
];

const dependencyLines = [
  '    implementation project(":onnxruntime-react-native")',
];

const importLines = [
  'import ai.onnxruntime.reactnative.OnnxruntimePackage',
];

const packageLines = [
  '          add(OnnxruntimePackage())',
];

function insertMissingLinesAfter(contents, anchor, lines) {
  const missingLines = lines.filter((line) => !contents.includes(line));

  if (missingLines.length === 0) {
    return contents;
  }

  const index = contents.indexOf(anchor);
  if (index === -1) {
    throw new Error(`Unable to find Android native module insertion anchor: ${anchor}`);
  }

  const insertionIndex = contents.indexOf('\n', index);
  if (insertionIndex === -1) {
    return `${contents}\n${missingLines.join('\n')}`;
  }

  return `${contents.slice(0, insertionIndex + 1)}${missingLines.join('\n')}\n${contents.slice(
    insertionIndex + 1,
  )}`;
}

function withDocumentScannerAndroidSettings(config) {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents = insertMissingLinesAfter(
      config.modResults.contents,
      "include ':app'",
      settingsLines,
    );
    return config;
  });
}

function withDocumentScannerAndroidBuild(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('DocumentRectifier config plugin only supports Groovy app/build.gradle files.');
    }

    config.modResults.contents = insertMissingLinesAfter(
      config.modResults.contents,
      '    implementation("com.facebook.react:react-android")',
      dependencyLines,
    );
    return config;
  });
}

function withDocumentScannerMainApplication(config) {
  return withMainApplication(config, (config) => {
    if (config.modResults.language !== 'kt') {
      throw new Error('DocumentRectifier config plugin only supports Kotlin MainApplication files.');
    }

    let contents = insertMissingLinesAfter(
      config.modResults.contents,
      'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint',
      importLines,
    );

    contents = insertMissingLinesAfter(
      contents,
      '          // add(MyReactNativePackage())',
      packageLines,
    );

    config.modResults.contents = contents;
    return config;
  });
}

function withDocumentScannerNativeModules(config) {
  config = withDocumentScannerAndroidSettings(config);
  config = withDocumentScannerAndroidBuild(config);
  config = withDocumentScannerMainApplication(config);

  return config;
}

module.exports = createRunOncePlugin(
  withDocumentScannerNativeModules,
  pkg.name,
  pkg.version,
);
