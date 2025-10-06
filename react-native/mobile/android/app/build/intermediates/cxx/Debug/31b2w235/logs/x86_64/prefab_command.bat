@echo off
"C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\diego\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86_64 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\diego\\AppData\\Local\\Temp\\agp-prefab-staging13685338849552035342\\staged-cli-output" ^
  "C:\\Users\\diego\\.gradle\\caches\\8.14.3\\transforms\\5e3de19cdc6bd36e24739a92b8cabbb2\\transformed\\react-android-0.81.4-debug\\prefab" ^
  "C:\\Users\\diego\\.gradle\\caches\\8.14.3\\transforms\\aae44064e5ebb5af022ad83ed0ca6e0a\\transformed\\hermes-android-0.81.4-debug\\prefab" ^
  "C:\\Users\\diego\\.gradle\\caches\\8.14.3\\transforms\\48f32c88ab848eeaa4d6425b771aa34b\\transformed\\fbjni-0.7.0\\prefab"
