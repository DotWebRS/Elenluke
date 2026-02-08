declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export class GLTFLoader {
    constructor(manager?: any);
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: any) => void,
      onError?: (error: any) => void,
    ): void;
    setDRACOLoader(loader: any): this;
  }
}

declare module "three/examples/jsm/loaders/DRACOLoader.js" {
  export class DRACOLoader {
    constructor(manager?: any);
    setDecoderPath(path: string): this;
    setDecoderConfig(config: any): this;
    dispose(): void;
  }
}

declare module "three/examples/jsm/environments/RoomEnvironment.js" {
  export class RoomEnvironment {
    constructor();
  }
}
