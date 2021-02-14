import { Renderer } from 'expo-three';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { State as GHState } from 'react-native-gesture-handler';

import Engine from './Engine';
import CONSTANTS from './Constants';
import { GLEvent, ResizeEvent } from '../components/GraphicsView';


export default class State {
  private _width: number;
  private _height: number;
  engine: Engine | null = null;
  renderer: Renderer | null = null;
  private _isdragging: boolean = false;
  private _minPressDuration: number = 500; // milliseconds
  private _timeout: ReturnType<typeof setTimeout>;

  onContextCreateAsync = async ({ gl, width, height, pixelRatio }) => {
    this.renderer = new Renderer({
      gl,
      width,
      height,
      pixelRatio,
      clearColor: CONSTANTS.sceneColor,
    });

    this._width = width;
    this._height = height;
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

      this.engine.isDragging = true
    }
  }

  stopDragging() {
    if (this._isdragging) {
      this._isdragging = false;

      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      this.engine.isDragging = false;
    }
  }

  handlePanResponderMove = (evt, {moveY, moveX, vx, vy, ...rest}) => {
    // check if it's dragging.
    if (this._isdragging) {
      // if it's dragging update the x by moveX and y by moveY
      this.engine.dragEarthTo({moveY, moveX});
      return;
    }
    this.engine.rotateVelocity = {x: -vx/20, y: vy/20};
  }

  handlePanResponderStart = (evt, {x0, y0}) => {
    this.engine.isDecelerating = false;
    this._timeout = setTimeout(() => {
      this.onLongPressBegin({ nativeEvent: {x: x0, y: y0, state: GHState.ACTIVE}});
    }, this._minPressDuration);
  }

  handlePanResponderEnd = (evt, gestureState) => {
    this.engine.isDecelerating = true;
    this.stopDragging();
    clearTimeout(this._timeout);
  }
}
