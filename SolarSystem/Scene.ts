import * as THREE from 'three';
import CONSTANTS from './Constants';

export default class Scene extends THREE.Scene {
  private get color(): THREE.Color {
    return new THREE.Color(CONSTANTS.sceneColor);
  }

  constructor () {
    super();
    this.fog = new THREE.Fog(this.color, 1, 10000);
  }
}
