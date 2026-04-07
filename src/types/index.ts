// Types for PangaRent

export type UserRole = 'superuser' | 'landlord' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  floors: Floor[];
  landlordId: string;
  createdAt: string;
}

export interface Floor {
  id: string;
  name: string;
  number: number;
  propertyId: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  name: string;
  floorId: string;
  propertyId: string;
  rentAmount: number;
  garbageFee: number;
  waterPerUnit: number;
  isOccupied: boolean;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  unitId?: string;
  propertyId?: string;
  moveInDate?: string;
  balance: number;
  overpayment: number;
  userId?: string;
  accountStatus?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'failed';
  method: 'mpesa' | 'bank' | 'cash';
  breakdown: {
    rent: number;
    water: number;
    garbage: number;
  };
}

export interface BillingRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  unitName: string;
  month: string;
  currentWaterReading: number;
  previousWaterReading: number;
  waterConsumption: number;
  waterCost: number;
  waterPerUnit: number;
  rent: number;
  garbageFee: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid';
}

export interface Notification {
  id: string;
  type: 'sms' | 'email' | 'system';
  title: string;
  message: string;
  date: string;
  read: boolean;
}
