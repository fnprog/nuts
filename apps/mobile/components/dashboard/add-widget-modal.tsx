import { View, Modal, Pressable, ScrollView } from 'react-native';
import { Text } from '../ui';
import Icon, { IconName } from 'react-native-remix-icon';
import { AVAILABLE_WIDGETS, WidgetType } from '../../lib/services/dashboard/dashboard.types';
import { triggerHaptic } from '../../lib/haptics';

interface AddWidgetModalProps {
  visible: boolean;
  onClose: () => void;
  onAddWidget: (widgetType: WidgetType) => void;
  existingWidgets: string[];
}

export function AddWidgetModal({
  visible,
  onClose,
  onAddWidget,
  existingWidgets,
}: AddWidgetModalProps) {
  const handleAddWidget = (widgetType: WidgetType) => {
    triggerHaptic('medium');
    onAddWidget(widgetType);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background max-h-[80%] rounded-t-3xl p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-foreground text-xl font-bold">Add Widget</Text>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}>
              <Icon name="close-line" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-3">
              {AVAILABLE_WIDGETS.map((widget) => {
                const isAdded = existingWidgets.includes(widget.type);

                return (
                  <Pressable
                    key={widget.id}
                    onPress={() => !isAdded && handleAddWidget(widget.type)}
                    disabled={isAdded}
                    className={`bg-card border-border flex-row items-center rounded-xl border p-4 ${
                      isAdded ? 'opacity-50' : 'opacity-100'
                    }`}>
                    <View className="bg-primary/10 mr-3 h-12 w-12 items-center justify-center rounded-lg">
                      <Icon name={widget.icon as IconName} size={24} color="#F97316" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground mb-1 font-semibold">{widget.title}</Text>
                      <Text className="text-muted-foreground text-xs">{widget.description}</Text>
                    </View>
                    {isAdded ? (
                      <Icon name="check-line" size={20} color="#10B981" />
                    ) : (
                      <Icon name="add-line" size={20} color="#F97316" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
