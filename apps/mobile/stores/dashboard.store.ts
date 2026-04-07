import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DashboardLayout,
  DashboardWidget,
  WidgetType,
  WidgetSize,
  DEFAULT_DASHBOARD_LAYOUT,
  AVAILABLE_WIDGETS,
} from '../lib/services/dashboard/dashboard.types';

interface DashboardState {
  layout: DashboardLayout;
  isEditMode: boolean;
  isLoading: boolean;
  addWidget: (widgetType: WidgetType) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetSize: (widgetId: string, size: WidgetSize) => void;
  toggleWidgetLock: (widgetId: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  setEditMode: (enabled: boolean) => void;
  resetLayout: () => void;
  initialize: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_DASHBOARD_LAYOUT,
      isEditMode: false,
      isLoading: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          const storedLayout = await AsyncStorage.getItem('dashboard-layout');
          if (storedLayout) {
            const parsed = JSON.parse(storedLayout);
            set({ layout: parsed, isLoading: false });
          } else {
            set({ layout: DEFAULT_DASHBOARD_LAYOUT, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to initialize dashboard:', error);
          set({ layout: DEFAULT_DASHBOARD_LAYOUT, isLoading: false });
        }
      },

      addWidget: (widgetType: WidgetType) => {
        const { layout } = get();
        const widgetConfig = AVAILABLE_WIDGETS.find((w) => w.type === widgetType);

        if (!widgetConfig) {
          console.error(`Widget type "${widgetType}" not found`);
          return;
        }

        const existingWidget = layout.widgets.find((w) => w.type === widgetType);
        if (existingWidget) {
          console.warn(`Widget "${widgetType}" already exists on dashboard`);
          return;
        }

        const newWidget: DashboardWidget = {
          id: `${widgetType}-${Date.now()}`,
          type: widgetType,
          size: widgetConfig.defaultSize,
          position: layout.widgets.length,
          isLocked: false,
        };

        set({
          layout: {
            widgets: [...layout.widgets, newWidget],
          },
        });
      },

      removeWidget: (widgetId: string) => {
        const { layout } = get();
        const updatedWidgets = layout.widgets
          .filter((w) => w.id !== widgetId)
          .map((w, index) => ({ ...w, position: index }));

        set({
          layout: {
            widgets: updatedWidgets,
          },
        });
      },

      updateWidgetSize: (widgetId: string, size: WidgetSize) => {
        const { layout } = get();
        set({
          layout: {
            widgets: layout.widgets.map((w) => (w.id === widgetId ? { ...w, size } : w)),
          },
        });
      },

      toggleWidgetLock: (widgetId: string) => {
        const { layout } = get();
        set({
          layout: {
            widgets: layout.widgets.map((w) =>
              w.id === widgetId ? { ...w, isLocked: !w.isLocked } : w
            ),
          },
        });
      },

      reorderWidgets: (widgets: DashboardWidget[]) => {
        const reorderedWidgets = widgets.map((w, index) => ({ ...w, position: index }));
        set({
          layout: {
            widgets: reorderedWidgets,
          },
        });
      },

      setEditMode: (enabled: boolean) => {
        set({ isEditMode: enabled });
      },

      resetLayout: () => {
        set({ layout: DEFAULT_DASHBOARD_LAYOUT });
      },
    }),
    {
      name: 'dashboard-layout',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
