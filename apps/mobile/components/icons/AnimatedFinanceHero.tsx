import { useEffect } from 'react';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

interface AnimatedFinanceHeroProps {
  width?: number;
  height?: number;
}

export function AnimatedFinanceHero({ width = 280, height = 200 }: AnimatedFinanceHeroProps) {
  const coin1Y = useSharedValue(0);
  const coin2Y = useSharedValue(0);
  const billGreenY = useSharedValue(0);
  const billPurpleY = useSharedValue(0);
  const billOrangeY = useSharedValue(0);
  const peanut1Y = useSharedValue(0);
  const peanut2Y = useSharedValue(0);
  const peanut3Y = useSharedValue(0);

  useEffect(() => {
    coin1Y.value = withRepeat(
      withTiming(15, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    coin2Y.value = withRepeat(
      withTiming(-12, {
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    billGreenY.value = withRepeat(
      withTiming(18, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    billPurpleY.value = withRepeat(
      withTiming(-10, {
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    billOrangeY.value = withRepeat(
      withTiming(14, {
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    peanut1Y.value = withRepeat(
      withTiming(-8, {
        duration: 2300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    peanut2Y.value = withRepeat(
      withTiming(10, {
        duration: 2600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    peanut3Y.value = withRepeat(
      withTiming(-12, {
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const coin1Transform = useDerivedValue(() => [{ translateY: coin1Y.value }]);
  const coin2Transform = useDerivedValue(() => [{ translateY: coin2Y.value }]);
  const billGreenTransform = useDerivedValue(() => [{ translateY: billGreenY.value }]);
  const billPurpleTransform = useDerivedValue(() => [{ translateY: billPurpleY.value }]);
  const billOrangeTransform = useDerivedValue(() => [{ translateY: billOrangeY.value }]);
  const peanut1Transform = useDerivedValue(() => [{ translateY: peanut1Y.value }]);
  const peanut2Transform = useDerivedValue(() => [{ translateY: peanut2Y.value }]);
  const peanut3Transform = useDerivedValue(() => [{ translateY: peanut3Y.value }]);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={coin1Transform} origin={{ x: 30, y: 30 }}>
        <Path
          path="M20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10Z"
          color="#F59E0B"
          style="fill"
          transform={[{ translateX: 20 }, { translateY: 20 }]}
        />
        <Path
          path="M14 10C14 12.209 12.209 14 10 14C7.791 14 6 12.209 6 10C6 7.791 7.791 6 10 6C12.209 6 14 7.791 14 10Z"
          color="#FBBF24"
          style="fill"
          transform={[{ translateX: 20 }, { translateY: 20 }]}
        />
        <Path
          path="M10 4V5M10 15V16M7.5 8C7.5 6.895 8.395 6 9.5 6H11C12.105 6 13 6.895 13 8C13 9.105 12.105 10 11 10H9C7.895 10 7 10.895 7 12C7 13.105 7.895 14 9 14H10.5C11.605 14 12.5 13.105 12.5 12"
          color="#F59E0B"
          style="stroke"
          strokeWidth={1.5}
          transform={[{ translateX: 20 }, { translateY: 20 }]}
        />
      </Group>

      <Group transform={billGreenTransform} origin={{ x: 140, y: 50 }}>
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#86EFAC"
          style="fill"
          transform={[{ translateX: 115 }, { translateY: 30 }]}
        />
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#22C55E"
          style="stroke"
          strokeWidth={2}
          transform={[{ translateX: 115 }, { translateY: 30 }]}
        />
        <Path
          path="M25 13C25 16.866 21.866 20 18 20C14.134 20 11 16.866 11 13C11 9.134 14.134 6 18 6C21.866 6 25 9.134 25 13Z"
          color="#22C55E"
          style="fill"
          transform={[{ translateX: 115 }, { translateY: 30 }]}
        />
        <Path
          path="M8 8C8 9.105 7.105 10 6 10C4.895 10 4 9.105 4 8C4 6.895 4.895 6 6 6C7.105 6 8 6.895 8 8Z"
          color="#22C55E"
          style="fill"
          transform={[{ translateX: 115 }, { translateY: 30 }]}
        />
        <Path
          path="M46 18C46 19.105 45.105 20 44 20C42.895 20 42 19.105 42 18C42 16.895 42.895 16 44 16C45.105 16 46 16.895 46 18Z"
          color="#22C55E"
          style="fill"
          transform={[{ translateX: 115 }, { translateY: 30 }]}
        />
      </Group>

      <Group transform={billPurpleTransform} origin={{ x: 50, y: 120 }}>
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#D8B4FE"
          style="fill"
          transform={[{ translateX: 25 }, { translateY: 105 }, { scale: 0.9 }]}
        />
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#A855F7"
          style="stroke"
          strokeWidth={2}
          transform={[{ translateX: 25 }, { translateY: 105 }, { scale: 0.9 }]}
        />
        <Path
          path="M25 13C25 16.866 21.866 20 18 20C14.134 20 11 16.866 11 13C11 9.134 14.134 6 18 6C21.866 6 25 9.134 25 13Z"
          color="#A855F7"
          style="fill"
          transform={[{ translateX: 25 }, { translateY: 105 }, { scale: 0.9 }]}
        />
        <Path
          path="M8 8C8 9.105 7.105 10 6 10C4.895 10 4 9.105 4 8C4 6.895 4.895 6 6 6C7.105 6 8 6.895 8 8Z"
          color="#A855F7"
          style="fill"
          transform={[{ translateX: 25 }, { translateY: 105 }, { scale: 0.9 }]}
        />
        <Path
          path="M46 18C46 19.105 45.105 20 44 20C42.895 20 42 19.105 42 18C42 16.895 42.895 16 44 16C45.105 16 46 16.895 46 18Z"
          color="#A855F7"
          style="fill"
          transform={[{ translateX: 25 }, { translateY: 105 }, { scale: 0.9 }]}
        />
      </Group>

      <Group transform={billOrangeTransform} origin={{ x: 215, y: 115 }}>
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#FED7AA"
          style="fill"
          transform={[{ translateX: 190 }, { translateY: 100 }, { scale: 0.85 }]}
        />
        <Path
          path="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V22C50 24.2091 48.2091 26 46 26H4C1.79086 26 0 24.2091 0 22V4Z"
          color="#FB923C"
          style="stroke"
          strokeWidth={2}
          transform={[{ translateX: 190 }, { translateY: 100 }, { scale: 0.85 }]}
        />
        <Path
          path="M25 13C25 16.866 21.866 20 18 20C14.134 20 11 16.866 11 13C11 9.134 14.134 6 18 6C21.866 6 25 9.134 25 13Z"
          color="#FB923C"
          style="fill"
          transform={[{ translateX: 190 }, { translateY: 100 }, { scale: 0.85 }]}
        />
        <Path
          path="M8 8C8 9.105 7.105 10 6 10C4.895 10 4 9.105 4 8C4 6.895 4.895 6 6 6C7.105 6 8 6.895 8 8Z"
          color="#FB923C"
          style="fill"
          transform={[{ translateX: 190 }, { translateY: 100 }, { scale: 0.85 }]}
        />
        <Path
          path="M46 18C46 19.105 45.105 20 44 20C42.895 20 42 19.105 42 18C42 16.895 42.895 16 44 16C45.105 16 46 16.895 46 18Z"
          color="#FB923C"
          style="fill"
          transform={[{ translateX: 190 }, { translateY: 100 }, { scale: 0.85 }]}
        />
      </Group>

      <Group transform={coin2Transform} origin={{ x: 240, y: 25 }}>
        <Path
          path="M20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10Z"
          color="#F59E0B"
          style="fill"
          transform={[{ translateX: 230 }, { translateY: 15 }, { scale: 0.7 }]}
        />
        <Path
          path="M14 10C14 12.209 12.209 14 10 14C7.791 14 6 12.209 6 10C6 7.791 7.791 6 10 6C12.209 6 14 7.791 14 10Z"
          color="#FBBF24"
          style="fill"
          transform={[{ translateX: 230 }, { translateY: 15 }, { scale: 0.7 }]}
        />
        <Path
          path="M10 4V5M10 15V16M7.5 8C7.5 6.895 8.395 6 9.5 6H11C12.105 6 13 6.895 13 8C13 9.105 12.105 10 11 10H9C7.895 10 7 10.895 7 12C7 13.105 7.895 14 9 14H10.5C11.605 14 12.5 13.105 12.5 12"
          color="#F59E0B"
          style="stroke"
          strokeWidth={1.5}
          transform={[{ translateX: 230 }, { translateY: 15 }, { scale: 0.7 }]}
        />
      </Group>

      <Group transform={peanut1Transform} origin={{ x: 50, y: 170 }}>
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#DEB887"
          style="fill"
          transform={[{ translateX: 40 }, { translateY: 160 }, { scale: 1.2 }]}
        />
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#D2691E"
          style="stroke"
          strokeWidth={1}
          transform={[{ translateX: 40 }, { translateY: 160 }, { scale: 1.2 }]}
        />
      </Group>

      <Group transform={peanut2Transform} origin={{ x: 140, y: 165 }}>
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#DEB887"
          style="fill"
          transform={[{ translateX: 130 }, { translateY: 155 }, { scale: 1.4 }]}
        />
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#D2691E"
          style="stroke"
          strokeWidth={1}
          transform={[{ translateX: 130 }, { translateY: 155 }, { scale: 1.4 }]}
        />
      </Group>

      <Group transform={peanut3Transform} origin={{ x: 220, y: 172 }}>
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#F5DEB3"
          style="fill"
          transform={[{ translateX: 210 }, { translateY: 162 }, { scale: 1.1 }]}
        />
        <Path
          path="M12 0C14.209 0 16 1.791 16 4C16 5.326 15.404 6.507 14.472 7.293C15.371 7.962 16 9.054 16 10.5C16 12.985 13.985 15 11.5 15C9.015 15 7 12.985 7 10.5C7 9.054 7.629 7.962 8.528 7.293C7.596 6.507 7 5.326 7 4C7 1.791 8.791 0 12 0Z"
          color="#D2691E"
          style="stroke"
          strokeWidth={1}
          transform={[{ translateX: 210 }, { translateY: 162 }, { scale: 1.1 }]}
        />
      </Group>
    </Canvas>
  );
}
