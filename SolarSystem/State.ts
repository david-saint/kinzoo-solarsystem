import { Renderer } from 'expo-three';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { State as GHState } from 'react-native-gesture-handler';

import Engine from './Engine';
import CONSTANTS from './Constants';
import { GLEvent, ResizeEvent } from '../components/GraphicsView';


export default class State {
  engine: Engine | null = null;
  renderer: Renderer | null = null;
  private _isdragging: boolean = false;

  onContextCreateAsync = async ({ gl, width, height, pixelRatio }) => {
    this.renderer = new Renderer({
      gl,
      width,
      height,
      pixelRatio,
      clearColor: CONSTANTS.sceneColor,
    });

    this.engine = new Engine(width, height, this.renderer);
    await this.engine.loadAsync();
  };

  onResize = ({ scale, width, height }: ResizeEvent) => {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    if (this.engine) {
      if (this.engine.camera) {
        this.engine.camera.aspect = width / height;
        this.engine.camera.updateProjectionMatrix();
      }
    }
  };

  onRender = (delta: number, time: number) => {
    if (this.engine) {
      this.engine.update(delta, time);
      if (this.renderer) {
        this.renderer.render(this.engine.scene!, this.engine.camera!);
      }
    }
  };

  onLongPressBegin = ({ nativeEvent }) => {
    if (this.engine) {
      if (nativeEvent.state === GHState.ACTIVE) {
        this.startDragging(nativeEvent);
      } else {
        this.stopDragging();
      }
    }
  }

  startDragging(event) {
    // check if the earth was clicked
    if (this.engine.isEarthFocussed(event)) {
      this._isdragging = true;
      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  stopDragging() {
    if (this._isdragging) {
      this._isdragging = false;
      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  setCoords(x, y) {
    if (!this.engine) return;
    console.log(x, y);
    this.engine.setCoords(x, y);
  }
}