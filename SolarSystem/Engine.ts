import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

import Scene from './Scene';
import CONSTANTS from './Constants';

export default class Engine {
  public scene?: Scene;
  private _width: number;
  private _height: number;
  private _assets: Record<string, Asset>;
  public X: Animated.Value | null = null;
  public Y: Animated.Value | null = null;
  public camera?: THREE.PerspectiveCamera;
  public earth: THREE.Group = new THREE.Group();
  public tapPoint: THREE.Vector2 = new THREE.Vector2();
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  private rotateVelocity: {x: number; y: number} = { x: 0.0025, y: 0.005 };
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(width: number, height: number, public renderer: THREE.Renderer) {
    this._engine = this;
    this._width = width;
    this._height = height;
  }

  createCamera = (width: number, height: number): THREE.PerspectiveCamera => {
    const camera = new THREE.PerspectiveCamera(CONSTANTS.cameraFOV, width / height, 1, 100000);
    camera.position.set(200, 500, 500);
    camera.lookAt(new THREE.Vector3());
    this.originalCameraPosition = camera.position.clone();

    return camera;
  };

  async loadAsync() {
    this.scene = window.scene = new Scene();
    this.camera = await this.createCamera(this._width, this._height);

    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(0, 350, 500);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.9), light);

    this._assets = await this.loadAssets();

    this.build();
  }

  async loadAssets() {
    const assets = {
      clouds: Asset.fromModule(require('../images/fair_clouds_4k.png')),
      elev_bump: Asset.fromModule(require('../images/elev_bump_4k.jpg')),
      water: Asset.fromModule(require('../images/water_4k.png')),
      earth: Asset.fromModule(require('../images/2_no_clouds_4k.jpg')),
      stars: Asset.fromModule(require('../images/galaxy_starfield.png')),
    };

    for (const asset of Object.values(assets)) {
      await asset.downloadAsync();
    }

    return assets;
  }

  build() {
    const sphere = new EarthMesh(this._assets);
    const clouds = new EarthCloudMesh(this._assets);

    this.earth.add(sphere, clouds);
    const stars =  new StarsMesh(this._assets);
    this.scene.add(this.earth, stars);
  }

  update(delta: number, time: number) {
    if (!this.camera) return;

    this.camera.position.z = this.originalCameraPosition.z;
    this.camera.position.x = this.originalCameraPosition.x;

    this.earth.rotation.y += this.rotateVelocity.y;
    this.earth.rotation.x += this.rotateVelocity.x;

    if (this.X && this.Y) {
      this.earth.position.x = this.X.__getValue();
      this.earth.position.y = this.Y.__getValue();
    }
  }

  isEarthFocussed({x, y}) {
    this.tapPoint.x = ( x / this._width ) * 2 - 1;
    this.tapPoint.y = - ( y / this._height) * 2 + 1;

    this.raycaster.setFromCamera(this.tapPoint, this.camera);
    const intersects = this.raycaster.intersectObjects(this.earth.children);

    return intersects.length > 0;
  }

  setCoords(x, y) {
    this.X = x;
    this.Y = y;
  }
}

class EarthMesh extends THREE.Mesh {
  constructor(_assets) {
    super(
      new THREE.SphereGeometry(CONSTANTS.earthRadius, 32, 32 ),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(_assets.earth.localUri),
        bumpMap: new THREE.TextureLoader().load(_assets.elev_bump.localUri),
        bumpScale: 0.005,
        specularMap: new THREE.TextureLoader().load(_assets.water.localUri),
        specular: new THREE.Color('grey')
      })
    );
  }
}

class EarthCloudMesh extends THREE.Mesh {
  constructor(_assets) {
    super(
      new THREE.SphereGeometry(CONSTANTS.earthRadius + 5, 32, 32 ),
      new THREE.MeshPhongMaterial({
        transparent: true,
        // map: new THREE.TextureLoader().load(_assets.clouds.localUri),
      })
    );
  }
}

class StarsMesh extends THREE.Mesh {
  constructor(_assets) {
    super(
      new THREE.SphereGeometry(4000, 32, 32),
      new THREE.MeshBasicMaterial({
        // map:  new THREE.TextureLoader().load(_assets.stars.localUri),
        // side: THREE.BackSide,
        color: 0x272727
      })
    );
  }
}
