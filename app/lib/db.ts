export interface PackageMaster {
  id: string;
  type: string; // box, bag, etc.
  weight: number; // in kg
  unit: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMaster {

  id: string;
  name: string;
  code?: string;
  categoryId?: string;
  unit: string;
  hsnCode?: string;
  price?: number;
  description?: string;
  defaultLifeMonths: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {

  id: string;
  name: string;
  description?: string;
  lifeInMonths: number;
  lotType: 'Common' | 'Specific';
  hsnCode?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Party {

  id: string;
  name: string;
  contactPerson?: string;
  mobileNo?: string;
  email?: string;
  address?: string;
  city?: string;
  gstNumber?: string;
  panNumber?: string;
  partyType?: string;
  paymentMode?: string;
  openingBalance?: number;
  aadhaarNumber?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Inward {
  id: string;
  inwardDate: string;
  partyId: string;
  productId: string;
  totalWeight: number;
  remainingWeight: number;
  quantity?: number; // Count of units (bags, boxes, etc)
  price?: number; // Base price
  additionalCharges?: number; // Loading, unloading, extra costs
  goodsCondition?: string;
  remarks?: string;
  inwardNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Outward {
  id: string;
  outwardDate: string;
  inwardId: string | Inward; // Can be ID or populated Inward object
  partyId: string;
  productId: string;
  outwardWeight: number;
  goodsCondition?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // UI helper fields (populated from join)
  inwardDetails?: Partial<Inward>;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  partyId: string;
  lineItems: Array<{
    inwardId: string;
    description: string;
    quantity: number;
    rate: number;
    tax: number;
    total: number;
  }>;
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  outwardDate?: string;
  storageMonths?: number;
  gst?: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Unpaid';
  paymentMode?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  paymentMode?: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const initialData: Inward[] = [
  { id: '1', inwardDate: '2025-08-01', totalWeight: 5000, remainingWeight: 5000, partyId: 'MORADIYA FRESH FOODS', productId: 'KESAR RAS GREEN DORI', goodsCondition: 'Good' },
  { id: '2', inwardDate: '2025-08-02', totalWeight: 3000, remainingWeight: 1000, partyId: 'ABC FARMS', productId: 'ALPHONSO MANGO', goodsCondition: 'Fair' },
];

declare global {
  var __inwards: Inward[] | undefined;
}

if (!global.__inwards) {
  global.__inwards = initialData;
}

export const getInwardsData = () => {
  return global.__inwards!;
};

export const setInwardsData = (data: Inward[]) => {
  global.__inwards = data;
};
