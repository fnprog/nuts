import { cn } from '@/lib/utils';
import { BlurView } from 'expo-blur';
import * as React from 'react';
import { Modal, Pressable, View, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function BottomModal({ visible, onClose, children, className }: BottomModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1">
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          onPress={onClose}
          className="absolute inset-0">
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 50}
            tint="dark"
            className="flex-1"
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          />
        </AnimatedPressable>

        <Animated.View
          entering={SlideInDown.duration(300).damping(20)}
          exiting={SlideOutDown.duration(250)}
          className={cn(
            'bg-background absolute right-0 bottom-0 left-0 rounded-t-[32px] px-6 pt-6 pb-8',
            className
          )}>
          <View className="bg-muted/50 mb-6 h-1 w-12 self-center rounded-full" />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export { BottomModal };
