import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import Scene from './Scene';
import CONSTANTS from './Constants';

export default class Engine {
  public scene?: Scene;
  private _width: number;
  private _height: number;
  public isDragging: boolean = false;
  public isDecelerating: boolean = true;
  private _assets: Record<string, Asset>;
  public camera?: THREE.PerspectiveCamera;
  public earth: THREE.Group = new THREE.Group();
  public tapPoint: THREE.Vector2 = new THREE.Vector2();
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  public rotateVelocity: {x: number; y: number} = {
    x: CONSTANTS.rVelocityX,
    y: CONSTANTS.rVelocityY,
  };

  constructor(width: number, height: number, public renderer: THREE.Renderer) {
    this._width = width;
    this._height = height;
  }

  createCamera = (width: number, height: number): THREE.PerspectiveCamera => {
    const camera = new THREE.PerspectiveCamera(CONSTANTS.cameraFOV, width / height, 1, 100000);
    camera.position.set(200, 200, 1000);
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

    this._assets = await (this._width > 600 ? this.loadAssets() : this.loadMobileAssets());

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

  async loadMobileAssets() {
    const assets = {
      clouds: Asset.fromModule(require('../images/fair_clouds_4k-mobile.png')),
      elev_bump: Asset.fromModule(require('../images/elev_bump_4k-mobile.jpg')),
      water: Asset.fromModule(require('../images/water_4k-mobile.png')),
      earth: Asset.fromModule(require('../images/2_no_clouds_4k-mobile.jpg')),
      stars: Asset.fromModule(require('../images/galaxy_starfield-mobile.png')),
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

    if (this.isDecelerating) {
      // TODO: Implement this better with tweenmax or something
      const ay = (this.rotateVelocity.y < 0) ? -0.001 : (this.rotateVelocity.y > CONSTANTS.rVelocityY ? 0.001 : 0);
      const ax = (this.rotateVelocity.x < 0) ? -0.001  : (this.rotateVelocity.x > CONSTANTS.rVelocityX ? 0.001  : 0);
      this.rotateVelocity.y -= ay;
      this.rotateVelocity.x -= ax;
    }
  }

  isEarthFocussed({x, y}) {
    this.tapPoint.x = ( x / this._width ) * 2 - 1;
    this.tapPoint.y = - ( y / this._height) * 2 + 1;

    this.raycaster.setFromCamera(this.tapPoint, this.camera);
    const intersects = this.raycaster.intersectObjects(this.earth.children);

    return intersects.length > 0;
  }

  dragEarthTo({moveX, moveY}) {
    const vec = new THREE.Vector3(); // create once and reuse
    const pos = new THREE.Vector3(); // create once and reuse

    vec.set(
        ( moveX / this._width ) * 2 - 1,
        - ( moveY / this._height ) * 2 + 1,
        0.5 );

    vec.unproject( this.camera );

    vec.sub( this.camera.position ).normalize();

    const distance = - this.camera.position.z / vec.z;

    pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );

    this.earth.position.x = pos.x;
    this.earth.position.y = pos.y;
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
        // color: 0xff00ff
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
        map: new THREE.TextureLoader().load(_assets.clouds.localUri),
        // color: 0xff00ff,
      })
    );
  }
}

class StarsMesh extends THREE.Mesh {
  constructor(_assets) {
    super(
      new THREE.SphereGeometry(4000, 32, 32),
      new THREE.MeshBasicMaterial({
        map:  new THREE.TextureLoader().load(_assets.stars.localUri),
        side: THREE.BackSide,
        // color: 0x272727
      })
    );
  }
}
