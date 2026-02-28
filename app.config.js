export default ({ config }) => {
  const isProduction = process.env.APP_ENV === "production";
  const explicitApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  const apiBaseUrl = explicitApiBase
    ? explicitApiBase
    : isProduction
      ? "https://api.u1rfoods.com"
      : "http://192.168.29.98:5000";

  return {
    ...config,
    name: "u1r-mobile",
    slug: "u1r-mobile",
    owner: "u1rparth",
    version: "1.0.1",
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
      versionCode: 2, // ✅ Added for Play Store update
      adaptiveIcon: {
        foregroundImage: "./src/assets/icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      usesCleartextTraffic: true,
      permissions: ["RECORD_AUDIO", "INTERNET"],
      package: "com.u1rfoods.app"
    },

    extra: {
      apiBaseUrl,

      eas: {
        projectId: "053e4d52-8273-4df9-ad34-67a6560a1359"
      }
    }
  };
};