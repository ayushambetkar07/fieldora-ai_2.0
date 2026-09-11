import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  ProduceListing, 
  BuyerRequirement, 
  PurchaseRequest, 
  OrderItem, 
  Farmer, 
  Buyer 
} from '../types';
import { 
  MOCK_FARMERS, 
  MOCK_BUYERS, 
  MOCK_PRODUCE, 
  MOCK_REQUIREMENTS, 
  MOCK_REQUESTS, 
  MOCK_ORDERS 
} from '../data/mockData';
import {
  fetchProduceListings,
  createProduceListing,
  deleteProduceListing,
  fetchBuyerRequirements,
  createBuyerRequirement,
  fetchPurchaseRequests,
  createPurchaseRequest,
  updateRequestStatus,
  fetchOrders,
  createOrder,
  confirmFarmerTransportApi,
  dispatchOrderTransportApi,
  markOrderArrivedApi,
  verifyOrderQualityApi,
  releaseOrderPayoutApi,
  lockOrderEscrowApi
} from '../services/supabaseService';
import {
  AuthProfile,
  SignUpParams,
  SignInParams,
  signUpWithSupabase,
  signInWithSupabase,
  signOutWithSupabase,
  getCurrentAuthUser
} from '../services/authService';
import { supabase } from '../lib/supabaseClient';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: AuthProfile | null;
  currentFarmer: Farmer;
  currentBuyer: Buyer;
  
  // Auth Functions
  signUp: (params: SignUpParams) => Promise<{ success: boolean; error?: string }>;
  signIn: (params: SignInParams) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  
  produceList: ProduceListing[];
  addProduce: (produce: Omit<ProduceListing, 'id' | 'farmerId' | 'farmerName' | 'farmName' | 'isFarmerVerified' | 'createdDate'>) => Promise<void>;
  deleteProduce: (id: string) => Promise<void>;
  
  requirementsList: BuyerRequirement[];
  addRequirement: (req: Omit<BuyerRequirement, 'id' | 'buyerId' | 'buyerName' | 'companyName' | 'isBuyerVerified' | 'createdDate' | 'status'>) => Promise<void>;
  
  requestsList: PurchaseRequest[];
  sendPurchaseRequest: (request: Omit<PurchaseRequest, 'id' | 'buyerId' | 'buyerName' | 'buyerCompany' | 'isBuyerVerified' | 'createdDate' | 'status'>) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  counterRequest: (requestId: string, counterPrice: number, counterQuantity: number, message?: string) => Promise<void>;
  
  ordersList: OrderItem[];
  refreshOrders: () => Promise<void>;
  confirmFarmerTransport: (orderId: string, notes?: string) => Promise<boolean>;
  dispatchOrder: (orderId: string, details?: any) => Promise<boolean>;
  markOrderArrived: (orderId: string, arrivalRemarks?: string) => Promise<boolean>;
  verifyOrderQuality: (orderId: string, data: { actualReceivedQuantity: number; actualQuantityUnit?: string; qualityGrade: string; assayResult: string; assayNotes?: string; verificationRemarks?: string }) => Promise<boolean>;
  releaseOrderPayout: (orderId: string, notes?: string) => Promise<boolean>;
  lockOrderEscrow: (orderId: string) => Promise<boolean>;
  
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role State
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('fieldora_role');
    return (saved === 'farmer' || saved === 'buyer') ? saved : 'farmer';
  });

  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(() => {
    const saved = localStorage.getItem('fieldora_user');
    return saved ? JSON.parse(saved) : null;
  });

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem('fieldora_role', role);
    showToast(
      'Role Switched',
      `Switched active portal to ${role === 'farmer' ? 'Farmer / FPO Producer' : 'Enterprise Buyer'}`,
      'info'
    );
  };

  // Auth: Sign Up
  const signUp = async (params: SignUpParams): Promise<{ success: boolean; error?: string }> => {
    const res = await signUpWithSupabase(params);
    if (res.error) {
      showToast('Registration Error', res.error, 'error');
      return { success: false, error: res.error };
    }

    if (res.profile) {
      setCurrentUser(res.profile);
      setUserRoleState(res.profile.role);
      localStorage.setItem('fieldora_user', JSON.stringify(res.profile));
      localStorage.setItem('fieldora_role', res.profile.role);
      showToast('Account Created!', `Welcome to Fieldora, ${res.profile.name}!`, 'success');
    }

    return { success: true };
  };

  // Auth: Sign In
  const signIn = async (params: SignInParams): Promise<{ success: boolean; error?: string }> => {
    const res = await signInWithSupabase(params);
    if (res.error) {
      showToast('Sign In Failed', res.error, 'error');
      return { success: false, error: res.error };
    }

    if (res.profile) {
      setCurrentUser(res.profile);
      setUserRoleState(res.profile.role);
      localStorage.setItem('fieldora_user', JSON.stringify(res.profile));
      localStorage.setItem('fieldora_role', res.profile.role);
      showToast('Signed In', `Welcome back, ${res.profile.name}!`, 'success');
    }

    return { success: true };
  };

  // Auth: Sign Out
  const signOut = async () => {
    await signOutWithSupabase();
    setCurrentUser(null);
    localStorage.removeItem('fieldora_user');
    showToast('Signed Out', 'You have been signed out successfully.', 'info');
  };

  // Auto detect active session on mount
  useEffect(() => {
    const checkSession = async () => {
      const authUser = await getCurrentAuthUser();
      if (authUser) {
        setCurrentUser(authUser);
        setUserRoleState(authUser.role);
        localStorage.setItem('fieldora_user', JSON.stringify(authUser));
      }
    };
    checkSession();

    // Listen to Supabase auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getCurrentAuthUser();
        if (profile) {
          setCurrentUser(profile);
          setUserRoleState(profile.role);
          localStorage.setItem('fieldora_user', JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('fieldora_user');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const currentFarmer: Farmer = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    farmName: currentUser.organization || `${currentUser.name}'s Farm Cluster`,
    location: currentUser.location || 'Nashik, Maharashtra',
    state: currentUser.state || 'Maharashtra',
    rating: 4.9,
    completedDeals: 38,
    phone: currentUser.phone || '+91 98234 11200',
    isVerified: currentUser.isVerified,
    fpoMemberCount: 140,
  } : MOCK_FARMERS[0];

  const currentBuyer: Buyer = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    companyName: currentUser.organization || `${currentUser.name} Enterprise`,
    companyType: 'FMCG',
    location: currentUser.location || 'Mumbai, Maharashtra',
    state: currentUser.state || 'Maharashtra',
    isVerified: currentUser.isVerified,
    phone: currentUser.phone || '+91 99870 54321',
    gstNumber: '27AABCA1234F1Z5',
  } : MOCK_BUYERS[0];

  // Produce State
  const [produceList, setProduceList] = useState<ProduceListing[]>(() => {
    const saved = localStorage.getItem('fieldora_produce');
    return saved ? JSON.parse(saved) : MOCK_PRODUCE;
  });

  // Requirements State
  const [requirementsList, setRequirementsList] = useState<BuyerRequirement[]>(() => {
    const saved = localStorage.getItem('fieldora_requirements');
    return saved ? JSON.parse(saved) : MOCK_REQUIREMENTS;
  });

  // Requests State
  const [requestsList, setRequestsList] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('fieldora_requests');
    return saved ? JSON.parse(saved) : MOCK_REQUESTS;
  });

  // Orders State
  const [ordersList, setOrdersList] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('fieldora_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  // Initial Supabase Sync
  useEffect(() => {
    const initData = async () => {
      try {
        const [prod, reqs, reqList, ords] = await Promise.all([
          fetchProduceListings(),
          fetchBuyerRequirements(),
          fetchPurchaseRequests(),
          fetchOrders()
        ]);
        if (prod && prod.length > 0) setProduceList(prod);
        if (reqs && reqs.length > 0) setRequirementsList(reqs);
        if (reqList && reqList.length > 0) setRequestsList(reqList);
        if (ords && ords.length > 0) setOrdersList(ords);
      } catch (e) {
        console.warn('Initial Supabase sync fallback to memory:', e);
      }
    };
    initData();

    // Supabase Realtime Live Synchronization
    const channel = supabase
      .channel('fieldora-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produce_listings' }, async () => {
        const prod = await fetchProduceListings();
        if (prod && prod.length > 0) setProduceList(prod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buyer_requirements' }, async () => {
        const reqs = await fetchBuyerRequirements();
        if (reqs && reqs.length > 0) setRequirementsList(reqs);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_requests' }, async () => {
        const reqList = await fetchPurchaseRequests();
        if (reqList && reqList.length > 0) setRequestsList(reqList);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const ords = await fetchOrders();
        if (ords && ords.length > 0) setOrdersList(ords);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Assistant Drawer State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const toggleAssistant = () => setIsAssistantOpen(prev => !prev);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync to LocalStorage as backup
  useEffect(() => {
    localStorage.setItem('fieldora_produce', JSON.stringify(produceList));
  }, [produceList]);

  useEffect(() => {
    localStorage.setItem('fieldora_requirements', JSON.stringify(requirementsList));
  }, [requirementsList]);

  useEffect(() => {
    localStorage.setItem('fieldora_requests', JSON.stringify(requestsList));
  }, [requestsList]);

  useEffect(() => {
    localStorage.setItem('fieldora_orders', JSON.stringify(ordersList));
  }, [ordersList]);

  // Handler: Add Produce (Farmer)
  const addProduce = async (newProduce: Omit<ProduceListing, 'id' | 'farmerId' | 'farmerName' | 'farmName' | 'isFarmerVerified' | 'createdDate'>) => {
    const fallbackId = `PROD-${Date.now().toString().slice(-4)}`;
    const tempItem: ProduceListing = {
      ...newProduce,
      id: fallbackId,
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmName: currentFarmer.farmName,
      isFarmerVerified: true,
      createdDate: new Date().toISOString().split('T')[0],
      imageUrl: newProduce.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    };

    setProduceList(prev => [tempItem, ...prev]);

    // Send to Supabase
    const dbItem = await createProduceListing({
      ...tempItem,
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmName: currentFarmer.farmName,
      isFarmerVerified: true,
    });

    if (dbItem) {
      setProduceList(prev => prev.map(p => p.id === fallbackId ? dbItem : p));
    }

    showToast('Listing Published Live', `${newProduce.crop} (${newProduce.quantity} ${newProduce.unit}) is now visible in the Marketplace & Supabase!`, 'success');
  };

  // Handler: Delete Produce
  const deleteProduce = async (id: string) => {
    setProduceList(prev => prev.filter(p => p.id !== id));
    await deleteProduceListing(id);
    showToast('Listing Removed', 'Produce listing has been removed from marketplace', 'info');
  };

  // Handler: Add Requirement (Buyer)
  const addRequirement = async (req: Omit<BuyerRequirement, 'id' | 'buyerId' | 'buyerName' | 'companyName' | 'isBuyerVerified' | 'createdDate' | 'status'>) => {
    const fallbackId = `REQ-${Date.now().toString().slice(-3)}`;
    const tempItem: BuyerRequirement = {
      ...req,
      id: fallbackId,
      buyerId: currentBuyer.id,
      buyerName: currentBuyer.name,
      companyName: currentBuyer.companyName,
      isBuyerVerified: true,
      status: 'Open',
      createdDate: new Date().toISOString().split('T')[0],
      matchingScore: 92,
      matchingReasons: [
        { label: `Target price ₹${req.targetPrice}/q matches verified market reference`, isMatched: true },
        { label: `Delivery location (${req.deliveryLocation}) accessible by regional FPOs`, isMatched: true },
        { label: `Quality standard (${req.qualityRequirements}) supported`, isMatched: true },
      ]
    };

    setRequirementsList(prev => [tempItem, ...prev]);

    const dbItem = await createBuyerRequirement({
      ...tempItem,
      buyerId: currentBuyer.id,
      buyerName: currentBuyer.name,
      companyName: currentBuyer.companyName,
      isBuyerVerified: true,
      status: 'Open'
    });

    if (dbItem) {
      setRequirementsList(prev => prev.map(r => r.id === fallbackId ? dbItem : r));
    }

    showToast('Requirement Broadcasted', `Your requirement for ${tempItem.crop} has been published to verified FPOs.`, 'success');
  };

  // Handler: Send Purchase Request (Buyer)
  const sendPurchaseRequest = async (req: Omit<PurchaseRequest, 'id' | 'buyerId' | 'buyerName' | 'buyerCompany' | 'isBuyerVerified' | 'createdDate' | 'status'>) => {
    const fallbackId = `REQ-IN-${Date.now().toString().slice(-3)}`;
    const tempItem: PurchaseRequest = {
      ...req,
      id: fallbackId,
      buyerId: currentBuyer.id,
      buyerName: currentBuyer.name,
      buyerCompany: currentBuyer.companyName,
      isBuyerVerified: true,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
    };

    setRequestsList(prev => [tempItem, ...prev]);

    const dbItem = await createPurchaseRequest({
      ...tempItem,
      buyerId: currentBuyer.id,
      buyerName: currentBuyer.name,
      buyerCompany: currentBuyer.companyName,
      isBuyerVerified: true,
      status: 'Pending',
    });

    if (dbItem) {
      setRequestsList(prev => prev.map(r => r.id === fallbackId ? dbItem : r));
    }

    showToast('Purchase Request Sent', `Offer of ₹${req.offeredPrice}/q sent to ${req.farmerName}.`, 'success');
  };

  // Handler: Accept Request (Farmer accepts buyer offer -> creates Order)
  const acceptRequest = async (requestId: string) => {
    const req = requestsList.find(r => r.id === requestId);
    if (!req) return;

    // Update request status
    setRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Accepted' as const } : r));
    await updateRequestStatus(requestId, 'Accepted');

    // Create Order
    const orderNum = `FD-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = req.requestedQuantity * req.offeredPrice;
    
    const newOrder: OrderItem = {
      id: `ORD-${Date.now()}`,
      orderNumber: orderNum,
      requestId: req.id,
      produceId: req.produceId,
      crop: req.cropName,
      variety: 'Verified Grade A Lot',
      quantity: req.requestedQuantity,
      unit: req.unit,
      pricePerUnit: req.offeredPrice,
      totalAmount: total,
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmerFarm: currentFarmer.farmName,
      buyerId: req.buyerId,
      buyerName: req.buyerName,
      buyerCompany: req.buyerCompany,
      deliveryLocation: req.deliveryLocation,
      orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      status: 'Confirmed',
      paymentStatus: 'Pending',
      transportConfirmed: false,
      trackingSteps: [
        { title: 'Deal Agreed', description: 'Purchase request terms accepted by both parties.', date: 'Today', completed: true, current: false },
        { title: 'Confirm Transport', description: 'Farmer must confirm transport readiness.', date: 'Today', completed: false, current: true },
        { title: 'Buyer Escrow Deposit', description: 'Buyer deposits contract funds into secure smart escrow.', completed: false, current: false },
        { title: 'Logistics & Dispatch', description: 'Assigned transport vehicle en route to farm pickup.', completed: false, current: false },
        { title: 'Destination Quality & Weighment', description: 'Destination NABL assay & weighbridge verification.', completed: false, current: false },
        { title: 'Smart Escrow Released', description: 'Funds released to farmer upon dual assay/weight sign-off.', completed: false, current: false }
      ]
    };

    setOrdersList(prev => [newOrder, ...prev]);
    await createOrder(newOrder);

    showToast('Request Accepted & Order Created!', `Order #${orderNum} generated. Farmer must now confirm transport readiness.`, 'success');
  };

  // Handler: Reject Request (Farmer rejects)
  const rejectRequest = async (requestId: string) => {
    setRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' as const } : r));
    await updateRequestStatus(requestId, 'Rejected');
    showToast('Request Declined', 'Purchase request has been rejected.', 'info');
  };

  // Handler: Counter Request (Farmer proposes new price / terms)
  const counterRequest = async (requestId: string, counterPrice: number, counterQuantity: number, message?: string) => {
    setRequestsList(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'Countered' as const,
      counterPrice,
      counterQuantity,
      counterMessage: message
    } : r));

    showToast(
      'Counter-Offer Transmitted',
      `Counter rate of ₹${counterPrice.toLocaleString('en-IN')}/q transmitted to buyer.`,
      'success'
    );
  };

  // Handler: Refresh orders
  const refreshOrders = async () => {
    try {
      const ords = await fetchOrders();
      if (ords && ords.length > 0) setOrdersList(ords);
    } catch (e) {
      console.warn('Failed to refresh orders:', e);
    }
  };

  // Handler: Confirm Transport (Farmer Only)
  const confirmFarmerTransport = async (orderId: string, notes?: string): Promise<boolean> => {
    const updated = await confirmFarmerTransportApi(orderId, {
      confirmedBy: currentUser?.name || currentFarmer.name,
      notes
    });
    if (updated) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      showToast('Transport Confirmed!', `Order #${updated.orderNumber} transport confirmed. Buyer can now lock escrow.`, 'success');
      return true;
    }
    return false;
  };

  // Handler: Dispatch Order (Buyer / Logistics)
  const dispatchOrder = async (orderId: string, details?: any): Promise<boolean> => {
    const updated = await dispatchOrderTransportApi(orderId, details);
    if (updated) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      showToast('Transport Dispatched!', `Order #${updated.orderNumber} is now In Transit.`, 'success');
      return true;
    }
    return false;
  };

  // Handler: Lock Escrow (Buyer Only)
  const lockOrderEscrow = async (orderId: string): Promise<boolean> => {
    const targetOrder = ordersList.find(o => o.id === orderId);
    if (targetOrder && !targetOrder.transportConfirmed && targetOrder.status === 'Confirmed') {
      showToast('Farmer Confirmation Required', 'Farmer must confirm transport readiness before you can lock escrow.', 'warning');
      return false;
    }

    const updated = await lockOrderEscrowApi(orderId);
    if (updated) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      showToast('Escrow Locked', `Contract funds of ₹${updated.totalAmount.toLocaleString('en-IN')} secured in vault. Ready for dispatch!`, 'success');
      return true;
    }
    return false;
  };

  // Handler: Mark Arrived
  const markOrderArrived = async (orderId: string, arrivalRemarks?: string): Promise<boolean> => {
    const updated = await markOrderArrivedApi(orderId, {
      arrivedBy: currentUser?.name || (userRole === 'buyer' ? currentBuyer.name : currentFarmer.name),
      arrivalRemarks
    });

    if (updated) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      showToast('Shipment Arrived!', `Order #${updated.orderNumber} marked arrived at destination facility.`, 'success');
      return true;
    } else {
      setOrdersList(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Arrived' as const,
            arrivedAt: new Date().toISOString(),
            arrivalRemarks: arrivalRemarks || 'Arrived at destination'
          };
        }
        return o;
      }));
      showToast('Shipment Arrived', 'Arrival recorded successfully.', 'success');
      return true;
    }
  };

  // Handler: Verify Weight & Quality
  const verifyOrderQuality = async (
    orderId: string,
    data: {
      actualReceivedQuantity: number;
      actualQuantityUnit?: string;
      qualityGrade: string;
      assayResult: string;
      assayNotes?: string;
      verificationRemarks?: string;
    }
  ): Promise<boolean> => {
    const result = await verifyOrderQualityApi(orderId, {
      ...data,
      verifiedBy: currentUser?.name || 'Destination Assay Laboratory'
    });

    if (result.success && result.order) {
      const ord = result.order;
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...ord } : o));
      showToast(
        'Verification Complete',
        `Received ${data.actualReceivedQuantity} ${data.actualQuantityUnit || 'kg'} • ${data.qualityGrade} • Assay: ${data.assayResult}`,
        'success'
      );
      return true;
    } else {
      showToast('Verification Notice', result.error || 'Failed to verify order weight & quality', result.success ? 'success' : 'error');
      return result.success;
    }
  };

  // Handler: Release Payout
  const releaseOrderPayout = async (orderId: string, notes?: string): Promise<boolean> => {
    const result = await releaseOrderPayoutApi(orderId, { notes });
    if (result.success && result.order) {
      const ord = result.order;
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...ord } : o));
      showToast(
        'Smart Payout Released!',
        `Payout of ₹${(ord.payoutAmount || ord.totalAmount).toLocaleString('en-IN')} has been disbursed to ${ord.farmerName}.`,
        'success'
      );
      return true;
    } else {
      showToast('Payout Error', result.error || 'Failed to release smart escrow payout', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        currentUser,
        currentFarmer,
        currentBuyer,
        signUp,
        signIn,
        signOut,
        produceList,
        addProduce,
        deleteProduce,
        requirementsList,
        addRequirement,
        requestsList,
        sendPurchaseRequest,
        acceptRequest,
        rejectRequest,
        counterRequest,
        ordersList,
        refreshOrders,
        confirmFarmerTransport,
        dispatchOrder,
        markOrderArrived,
        verifyOrderQuality,
        releaseOrderPayout,
        lockOrderEscrow,
        isAssistantOpen,
        setIsAssistantOpen,
        toggleAssistant,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
