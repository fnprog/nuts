import { View, Pressable } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useDashboardStore } from '../../stores/dashboard.store';
import { Text } from '../../components/ui/text';
import Icon from 'react-native-remix-icon';
import { withUniwind } from 'uniwind';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WidgetCard } from '../../components/dashboard/widget-card';
import { WidgetRenderer } from '../../components/dashboard/widget-renderer';
import { AddWidgetModal } from '../../components/dashboard/add-widget-modal';
import { DashboardWidget, AVAILABLE_WIDGETS } from '../../lib/services/dashboard/dashboard.types';
import * as Haptics from 'expo-haptics';

export default function Dashboard() {
  const { user, isAnonymous } = useAuthStore();
  const {
    layout,
    isEditMode,
    setEditMode,
    reorderWidgets,
    removeWidget,
    updateWidgetSize,
    toggleWidgetLock,
    addWidget,
  } = useDashboardStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const StyledSafe = withUniwind(SafeAreaView);
  const StyledGestureRoot = withUniwind(GestureHandlerRootView);

  const handleRemoveWidget = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeWidget(id);
  };

  const handleSizeChange = (id: string, size: 'small' | 'medium' | 'large') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateWidgetSize(id, size);
  };

  const handleToggleLock = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWidgetLock(id);
  };

  const handleToggleEditMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditMode(!isEditMode);
  };

  const handleDragEnd = ({ data }: { data: DashboardWidget[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reorderWidgets(data);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<DashboardWidget>) => {
    const widgetConfig = AVAILABLE_WIDGETS.find((w) => w.type === item.type);
    if (!widgetConfig) return null;

    return (
      <ScaleDecorator>
        <Pressable onLongPress={isEditMode ? drag : undefined} disabled={!isEditMode || isActive}>
          <WidgetCard
            title={widgetConfig.title}
            size={item.size}
            isLocked={item.isLocked}
            isEditMode={isEditMode}
            isDragging={isActive}
            onRemove={() => handleRemoveWidget(item.id)}
            onSizeChange={(size) => handleSizeChange(item.id, size)}
            onToggleLock={() => handleToggleLock(item.id)}>
            <WidgetRenderer widgetType={item.type} />
          </WidgetCard>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <StyledGestureRoot className="flex-1">
      <StyledSafe className="flex-1">
        <View className="flex-1">
          <View className="mb-4 flex-row items-center justify-between px-6 pt-6">
            <Text variant="h3">{isAnonymous ? 'Welcome' : `Hi, ${user?.name || 'there'}!`}</Text>
            <Pressable
              onPress={handleToggleEditMode}
              className="h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Icon name={isEditMode ? 'check-line' : 'edit-line'} size="20" color="#F97316" />
            </Pressable>
          </View>

          {layout.widgets.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Icon name="layout-grid-line" size="64" color="#D1D5DB" />
              <Text className="text-muted-foreground mt-4 mb-2 text-center text-lg">
                No widgets yet
              </Text>
              <Text className="text-muted-foreground mb-6 text-center">
                Add widgets to customize your dashboard
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="flex-row items-center rounded-lg bg-[#F97316] px-6 py-3">
                <Icon name="add-line" size="20" color="white" />
                <Text className="ml-2 font-semibold text-white">Add Widget</Text>
              </Pressable>
            </View>
          ) : (
            <DraggableFlatList
              data={layout.widgets}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              containerStyle={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              activationDistance={isEditMode ? 5 : 999999}
            />
          )}

          {layout.widgets.length > 0 && (
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="absolute right-6 bottom-6 h-14 w-14 items-center justify-center rounded-full bg-[#F97316] shadow-lg"
              style={{ elevation: 5 }}>
              <Icon name="add-line" size="24" color="white" />
            </Pressable>
          )}
        </View>

        <AddWidgetModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddWidget={addWidget}
          existingWidgets={layout.widgets.map((w) => w.type)}
        />
      </StyledSafe>
    </StyledGestureRoot>
  );
}
