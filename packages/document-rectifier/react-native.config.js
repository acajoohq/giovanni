module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.margelo.nitro.docscanner.documentrectifier.DocumentRectifierPackage;',
        packageInstance: 'new DocumentRectifierPackage()',
      },
      ios: null,
    },
  },
};
