// premiumStore.js
import create from 'zustand';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'Pro'; // <-- use your real entitlement id from RC

export const usePremiumStore = create((set, get) => ({
  status: 'unknown', // 'unknown' | 'active' | 'inactive' | 'billing_issue'
  isPremium: false,
  expirationDate: null,
  productId: null,
  isSandbox: false,

  // Parse RC CustomerInfo -> store shape
  applyCustomerInfo: (customerInfo) => {
    const ent = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

    if (ent) {
      const billingIssue = !!ent.billingIssueDetectedAt;
      set({
        status: billingIssue ? 'billing_issue' : 'active',
        isPremium: true,
        expirationDate: ent.expirationDate || null,
        productId: ent.productIdentifier || null,
        isSandbox: !!ent.isSandbox,
      });
    } else {
      set({
        status: 'inactive',
        isPremium: false,
        expirationDate: null,
        productId: null,
        isSandbox: !!customerInfo?.entitlements?.all?.[ENTITLEMENT_ID]?.isSandbox,
      });
    }
  },

  refreshEntitlements: async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      get().applyCustomerInfo(info);
      return info;
    } catch (e) {
      // Keep previous state; optionally set status to 'unknown'
      return null;
    }
  },
}));
