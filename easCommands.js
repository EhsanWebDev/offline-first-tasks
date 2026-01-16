const easUsefulCommands = {
  toGenerateApk: {
    firstStep: "Add the following to the eas.json file",
    secondStep:
      'profile preview in eas.json file. like this: { "preview": { "android": { "buildType": "apk" } } }',
    command: "npx eas build --platform android --profile preview --local",
  },
};
