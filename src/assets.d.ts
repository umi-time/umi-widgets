declare module "*.svg" {
  const content: string;
  export default content;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.json" {
  const value: unknown;
  export default value;
}
