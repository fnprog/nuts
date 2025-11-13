import { View, Pressable } from 'react-native';
import { ReactNode } from 'react';
import { Text } from '../ui';
import Icon from 'react-native-remix-icon';
import { WidgetSize } from '../../lib/services/dashboard/dashboard.types';
import { triggerHaptic } from '../../lib/haptics';

interface WidgetCardProps {
  title: string;
  size: WidgetSize;
  isLocked?: boolean;
  isEditMode?: boolean;
  onRemove?: () => void;
  onToggleLock?: () => void;
  onSizeChange?: (size: WidgetSize) => void;
  isDragging?: boolean;
  children: ReactNode;
}

export function WidgetCard({
  title,
  size,
  isLocked = false,
  isEditMode = false,
  onRemove,
  onToggleLock,
  onSizeChange,
  isDragging = false,
  children,
}: WidgetCardProps) {
  const sizeClasses = {
    small: 'h-40',
    medium: 'h-64',
    large: 'h-96',
  };

  return (
    <View
      className={`bg-card border-border mb-4 rounded-xl border p-4 ${sizeClasses[size]} ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          {isEditMode && (
            <Icon name="draggable" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
          )}
          <Text className="text-foreground flex-1 font-semibold">{title}</Text>
        </View>

        {isEditMode && (
          <View className="flex-row gap-2">
            {onToggleLock && (
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  onToggleLock();
                }}>
                <Icon
                  name={isLocked ? 'lock-fill' : 'lock-unlock-line'}
                  size={18}
                  color="#9ca3af"
                />
              </Pressable>
            )}
            {onRemove && !isLocked && (
              <Pressable
                onPress={() => {
                  triggerHaptic('medium');
                  onRemove();
                }}>
                <Icon name="close-line" size={18} color="#ef4444" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View className="flex-1">{children}</View>

      {isEditMode && onSizeChange && !isLocked && (
        <View className="mt-2 flex-row justify-center gap-2">
          {(['small', 'medium', 'large'] as WidgetSize[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                triggerHaptic('light');
                onSizeChange(s);
              }}
              className={`rounded px-3 py-1 ${size === s ? 'bg-primary' : 'bg-muted'}`}>
              <Text
                className={`text-xs capitalize ${
                  size === s ? 'text-white' : 'text-muted-foreground'
                }`}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
