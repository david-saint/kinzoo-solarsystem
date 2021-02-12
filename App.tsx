import * as React from 'react';
import {
  State,
  PanGestureHandler,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { call, useCode } from 'react-native-reanimated';

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

  const X = new Animated.Value(0);
  const Y = new Animated.Value(0);

  React.useEffect(() => {
    machine?.setCoords(X, Y);
  }, []);

  const _onPanGestureEvent = Animated.event(
    [{
      nativeEvent: {
        translationX: X,
        translationY: Y,
      },
    }],
    {useNativeDriver: true},
  );

  return (
    <LongPressGestureHandler
      minDurationMs={500}
      onHandlerStateChange={machine?.onLongPressBegin}
    >
      <Animated.View style={{flex: 1}}>
        <PanGestureHandler
          onGestureEvent={_onPanGestureEvent}
        >
          <Animated.View style={{flex: 1}}>
            <GraphicsView
              key="solarSystem"
              onContextCreate={onContextCreate}
              onRender={machine?.onRender}
              onResize={machine?.onResize}
            />
          </Animated.View>
        </PanGestureHandler> 
      </Animated.View>
    </LongPressGestureHandler>
  );
}