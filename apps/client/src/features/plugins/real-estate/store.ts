import { create } from "zustand";
import { Property, RealEstateState } from "./types";
import { crdtService } from "@/core/sync/crdt";

interface RealEstateStore extends RealEstateState {
  loadProperties: () => Promise<void>;
  addProperty: (property: Property) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  removeProperty: (id: string) => Promise<void>;
  calculateTotals: () => void;
}

export const useRealEstateStore = create<RealEstateStore>()((set, get) => ({
  properties: [],
  totalValue: 0,
  totalEquity: 0,
  totalDebt: 0,
  totalRentalIncome: 0,

  loadProperties: async () => {
    const propertyCollection = crdtService.getPluginData<Omit<Property, "mortgage" | "rental">>("real-estate", "properties");
    const mortgageCollection = crdtService.getPluginData<Property["mortgage"]>("real-estate", "mortgages");
    const rentalCollection = crdtService.getPluginData<Property["rental"]>("real-estate", "rentals");
    
    const properties: Property[] = Object.values(propertyCollection).map((propertyData) => ({
      ...propertyData,
      mortgage: mortgageCollection[propertyData.id],
      rental: rentalCollection[propertyData.id],
    }));

    set({ properties });
    get().calculateTotals();
  },

  addProperty: async (property) => {
    const { mortgage, rental, ...propertyData } = property;

    await crdtService.createPluginRecord("real-estate", "properties", property.id, propertyData);

    if (mortgage) {
      await crdtService.createPluginRecord("real-estate", "mortgages", property.id, mortgage);
    }

    if (rental) {
      await crdtService.createPluginRecord("real-estate", "rentals", property.id, rental);
    }

    await get().loadProperties();
  },

  updateProperty: async (id, updatedProperty) => {
    const { mortgage, rental, ...propertyData } = updatedProperty;

    if (Object.keys(propertyData).length > 0) {
      await crdtService.updatePluginRecord("real-estate", "properties", id, propertyData);
    }

    if (mortgage !== undefined) {
      if (mortgage === null) {
        await crdtService.deletePluginRecord("real-estate", "mortgages", id);
      } else {
        const result = await crdtService.updatePluginRecord("real-estate", "mortgages", id, mortgage);
        if (result.isErr()) {
          await crdtService.createPluginRecord("real-estate", "mortgages", id, mortgage);
        }
      }
    }

    if (rental !== undefined) {
      if (rental === null) {
        await crdtService.deletePluginRecord("real-estate", "rentals", id);
      } else {
        const result = await crdtService.updatePluginRecord("real-estate", "rentals", id, rental);
        if (result.isErr()) {
          await crdtService.createPluginRecord("real-estate", "rentals", id, rental);
        }
      }
    }

    await get().loadProperties();
  },

  removeProperty: async (id) => {
    await crdtService.deletePluginRecord("real-estate", "properties", id);
    await crdtService.deletePluginRecord("real-estate", "mortgages", id);
    await crdtService.deletePluginRecord("real-estate", "rentals", id);

    await get().loadProperties();
  },

  calculateTotals: () => {
    const properties = get().properties;

    const totalValue = properties.reduce((sum, property) => sum + property.currentValue, 0);
    const totalDebt = properties.reduce((sum, property) => sum + (property.mortgage?.loanAmount || 0), 0);
    const totalEquity = totalValue - totalDebt;
    const totalRentalIncome = properties.reduce((sum, property) => (property.type === "rental" ? sum + (property.rental?.monthlyRent || 0) : sum), 0);

    set({
      totalValue,
      totalEquity,
      totalDebt,
      totalRentalIncome,
    });
  },
}));
