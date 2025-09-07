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

  // Combined/reactive flag
  hasPlus: false,               // ✅ reactive: personal OR family

  // Internals
  _rcUnsub: null,
  _familyUnsub: null,
  _familyPlus: false,           // mirror of familyStore.familyPremiumActive

  // ---- helpers ----
  _recomputeHasPlus: () =>
    set((s) => ({ hasPlus: !!s.isPremium || !!s._familyPlus })),

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
    get()._recomputeHasPlus();
  },

  refreshEntitlements: async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      get().applyCustomerInfo(info);
      return info;
    } catch {
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
        get()._recomputeHasPlus();
      }
    );
    set({ _familyUnsub: familyUnsub });

    if (doInitialRefresh) {
      await get().refreshEntitlements();
    }
    // ensure hasPlus is computed at least once
    get()._recomputeHasPlus();
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
      hasPlus: false,
      status: 'unknown',
      isPremium: false,
      expirationDate: null,
      productId: null,
      isSandbox: false,
    });
  },
}));
