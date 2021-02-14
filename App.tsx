import * as React from 'react';
import {
  State,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import { View, PanResponder } from 'react-native';

import SolarSystem from './SolarSystem/State';
import GraphicsView from "./components/GraphicsView";


export default function App() {
  const machine = React.useMemo(() => {
    return new SolarSystem();
  }, []);

  const onContextCreate = React.useCallback(
    async (props) => {
      if (machine) {
        await machine.onContextCreateAsync(props);
      }
    },
    [machine]
  );

  const panResponder = React.useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: machine?.handlePanResponderMove,
      onPanResponderRelease: machine?.handlePanResponderEnd,
      onPanResponderGrant: machine?.handlePanResponderStart,
      onPanResponderTerminate: machine?.handlePanResponderEnd,
    }),
    [machine]
  );

  return (
    <View style={{flex: 1}}  {...panResponder.panHandlers}>
      <GraphicsView
        key="solarSystem"
        onContextCreate={onContextCreate}
        onRender={machine?.onRender}
        onResize={machine?.onResize}
      />
    </View>
  );
}