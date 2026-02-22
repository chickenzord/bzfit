/// <reference types="nativewind/types" />

declare module "*.md" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}
