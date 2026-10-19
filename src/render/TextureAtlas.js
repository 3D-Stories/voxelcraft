import * as THREE from 'three';

const TILE_SIZE = 16;

export class TextureAtlas {
  constructor(textureNames, basePath = '/assets/textures/blocks') {
    if (!Array.isArray(textureNames) || textureNames.length === 0) {
      throw new Error('TextureAtlas requires a non-empty array of texture names');
    }
    for (const name of textureNames) {
      if (typeof name !== 'string' || name.length === 0) {
        throw new Error('TextureAtlas texture names must be non-empty strings');
      }
    }
    const names = [...new Set(textureNames)];
    if (names.length !== textureNames.length) {
      throw new Error('TextureAtlas texture names must be unique');
    }
    this._names = names;
    this._basePath = basePath;
    this._tileSize = TILE_SIZE;
    this._cols = Math.ceil(Math.sqrt(names.length));
    this._rows = Math.ceil(names.length / this._cols);
    this._tiles = new Map();
    this._texture = null;
    this._loadPromise = null;
  }

  get tileSize() {
    return this._tileSize;
  }

  get tiles() {
    return this._tiles;
  }

  get texture() {
    if (!this._texture) {
      throw new Error('TextureAtlas not loaded; await load() first');
    }
    return this._texture;
  }

  getTile(name) {
    const tile = this._tiles.get(name);
    if (!tile) {
      throw new Error(`Unknown texture tile: ${name}`);
    }
    return tile;
  }

  load() {
    if (!this._loadPromise) {
      this._loadPromise = this._build().catch((error) => {
        this._loadPromise = null;
        throw error;
      });
    }
    return this._loadPromise;
  }

  async _build() {
    const canvas = document.createElement('canvas');
    canvas.width = this._cols * this._tileSize;
    canvas.height = this._rows * this._tileSize;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('TextureAtlas requires a 2D canvas context');
    }
    context.imageSmoothingEnabled = false;

    const images = await Promise.all(this._names.map((name) => this._loadImage(name)));
    for (let i = 0; i < images.length; i += 1) {
      const name = this._names[i];
      const x = i % this._cols;
      const y = Math.floor(i / this._cols);
      context.drawImage(
        images[i],
        x * this._tileSize,
        y * this._tileSize,
        this._tileSize,
        this._tileSize,
      );
      this._tiles.set(name, {
        x,
        y,
        u0: x / this._cols,
        v0: y / this._rows,
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this._texture = texture;
    return this;
  }

  _loadImage(name) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load texture: ${name}`));
      image.src = `${this._basePath}/${name}.png`;
    });
  }
}
