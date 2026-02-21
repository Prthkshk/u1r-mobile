export default ({ config }) => {
  const isProduction = process.env.APP_ENV === "production";

  return {
    ...config,
    name: "u1r-mobile",
    slug: "u1r-mobile",
    owner: "u1rparth",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,

    splash: {
      image: "./src/assets/images/u1r-logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription:
          "We use the microphone for voice search.",
        NSSpeechRecognitionUsageDescription:
          "We use speech recognition to convert your voice to text for search."
      }
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      usesCleartextTraffic: true,
      permissions: ["RECORD_AUDIO"],
      package: "com.prthkshk.u1rmobile"
    },

    plugins: [
      [
        "@react-native-voice/voice",
        {
          microphonePermission:
            "Allow U1R to access microphone for voice search."
        }
      ]
    ],

    extra: {
      apiBaseUrl: isProduction
        ? "https://api.u1rfoods.com"
        : "http://192.168.29.98:5000",

      eas: {
        projectId: "053e4d52-8273-4df9-ad34-67a6560a1359"
      }
    }
  };
};