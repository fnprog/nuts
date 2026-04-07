import { View, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import { Text, Label } from './';
import Icon from 'react-native-remix-icon';
import { triggerHaptic } from '../../lib/haptics';
import { BottomModal } from './bottom-modal';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
    triggerHaptic('success');
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(newDate.getDate() + days);
    setTempDate(newDate);
    triggerHaptic('light');
  };

  const adjustTime = (minutes: number) => {
    const newDate = new Date(tempDate);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    setTempDate(newDate);
    triggerHaptic('light');
  };

  const setToNow = () => {
    setTempDate(new Date());
    triggerHaptic('light');
  };

  return (
    <>
      <View className="gap-2">
        {label && <Label>{label}</Label>}
        <Pressable
          onPress={() => {
            setTempDate(value);
            setShowPicker(true);
            triggerHaptic('light');
          }}
          className="bg-card border-border flex-row items-center justify-between rounded-xl border px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <Icon name="calendar-line" size="20" color="#888" />
            <Text className="text-foreground font-medium">{formatDate(value)}</Text>
            <Text className="text-muted-foreground">•</Text>
            <Text className="text-foreground font-medium">{formatTime(value)}</Text>
          </View>
          <Icon name="arrow-down-s-line" size="20" color="#888" />
        </Pressable>
      </View>

      <BottomModal visible={showPicker} onClose={() => setShowPicker(false)} className="pb-10">
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          exiting={FadeOutDown.duration(200)}
          className="gap-6">
          <View>
            <Text variant="h3" className="mb-2">
              Select Date & Time
            </Text>
            <Text className="text-muted-foreground">Choose when this transaction occurred</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Label>Date</Label>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => adjustDate(-1)}
                  className="bg-card border-border h-12 w-12 items-center justify-center rounded-xl border">
                  <Icon name="subtract-line" size="20" color="#888" />
                </Pressable>
                <View className="bg-primary/10 border-primary/20 flex-1 items-center justify-center rounded-xl border py-3">
                  <Text className="text-foreground text-base font-semibold">
                    {formatDate(tempDate)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustDate(1)}
                  className="bg-card border-border h-12 w-12 items-center justify-center rounded-xl border">
                  <Icon name="add-line" size="20" color="#888" />
                </Pressable>
              </View>
            </View>

            <View className="gap-2">
              <Label>Time</Label>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => adjustTime(-15)}
                  className="bg-card border-border h-12 w-12 items-center justify-center rounded-xl border">
                  <Icon name="subtract-line" size="20" color="#888" />
                </Pressable>
                <View className="bg-primary/10 border-primary/20 flex-1 items-center justify-center rounded-xl border py-3">
                  <Text className="text-foreground text-base font-semibold">
                    {formatTime(tempDate)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustTime(15)}
                  className="bg-card border-border h-12 w-12 items-center justify-center rounded-xl border">
                  <Icon name="add-line" size="20" color="#888" />
                </Pressable>
              </View>
              <Text className="text-muted-foreground text-center text-xs">
                Use +/- to adjust by 15 minutes
              </Text>
            </View>

            <Pressable
              onPress={setToNow}
              className="bg-muted/50 border-border flex-row items-center justify-center gap-2 rounded-xl border py-3">
              <Icon name="time-line" size="18" color="#888" />
              <Text className="text-foreground font-medium">Set to Now</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowPicker(false)}
              className="bg-card border-border flex-1 items-center justify-center rounded-xl border py-3.5">
              <Text className="text-foreground font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="bg-primary flex-1 items-center justify-center rounded-xl py-3.5">
              <Text className="text-primary-foreground font-semibold">Confirm</Text>
            </Pressable>
          </View>
        </Animated.View>
      </BottomModal>
    </>
  );
}
