import create from 'zustand';
import Purchases from 'react-native-purchases';
import useFamilyStore from './familyStore';

// IMPORTANT: match your RevenueCat entitlement exactly
const ENTITLEMENT_ID = 'Pro';

export const usePremiumStore = create((set, get) => ({
  // Personal (RevenueCat) state
  status: 'unknown',            // 'unknown' | 'active' | 'inactive' | 'billing_issue'
  isPremium: false,             // personal entitlement only
  expirationDate: null,
  productId: null,
  isSandbox: false,
  // Internals
  _rcUnsub: null,
  rcLoaded: false, 
  _familyUnsub: null,
  _familyPlus: false,           // mirror of familyStore.familyPremiumActive

  // ---- Mutators ----
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
        rcLoaded: true,
      });
    } else {
      set({
        status: 'inactive',
        isPremium: false,
        expirationDate: null,
        productId: null,
        isSandbox: !!customerInfo?.entitlements?.all?.[ENTITLEMENT_ID]?.isSandbox,
        rcLoaded: true,
      });
    }
  },

  refreshEntitlements: async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      get().applyCustomerInfo(info);
      return info;
    } catch {
      set({ rcLoaded: true });
      return null;
    }
  },

  /**
   * Initialize:
   * - RC listener
   * - subscribe to familyStore.familyPremiumActive and mirror it
   */
  initPremiumListeners: async ({ doInitialRefresh = true } = {}) => {
    // tear down previous listeners
    const prevRC = get()._rcUnsub;
    if (prevRC) try { prevRC(); } catch {}
    const prevFam = get()._familyUnsub;
    if (prevFam) try { prevFam(); } catch {}

    // RC listener
    const rcUnsub = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      try { get().applyCustomerInfo(customerInfo); } catch {}
    });
    set({ _rcUnsub: rcUnsub });

    // Family listener (cross-store)
    const familyUnsub = useFamilyStore.subscribe(
      (s) => s.familyPremiumActive,
      (val) => {
        set({ _familyPlus: !!val });
      }
    );
    set({ _familyUnsub: familyUnsub });

    if (doInitialRefresh) {
      await get().refreshEntitlements();
    }
  },

  cleanup: () => {
    const prevRC = get()._rcUnsub;
    if (prevRC) try { prevRC(); } catch {}
    const prevFam = get()._familyUnsub;
    if (prevFam) try { prevFam(); } catch {}

    set({
      _rcUnsub: null,
      _familyUnsub: null,
      _familyPlus: false,
      status: 'unknown',
      isPremium: false,
      expirationDate: null,
      productId: null,
      isSandbox: false,
    });
  },
}));
