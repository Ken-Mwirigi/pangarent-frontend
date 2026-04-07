import { Property, Tenant, Payment, BillingRecord, Notification, User } from '@/types';

export const mockUser: User = {
  id: '1',
  email: 'landlord@pangarent.com',
  name: 'James Mwangi',
  phone: '+254712345678',
  role: 'landlord',
};

export const mockTenantUser: User = {
  id: '2',
  email: 'tenant@pangarent.com',
  name: 'Mary Wanjiku',
  phone: '+254723456789',
  role: 'tenant',
};

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Sunrise Apartments',
    address: '123 Moi Avenue',
    city: 'Nairobi',
    landlordId: '1',
    createdAt: '2024-01-15',
    floors: [
      {
        id: 'f1',
        name: 'Ground Floor',
        number: 0,
        propertyId: '1',
        units: [
          { id: 'u1', name: 'G01', floorId: 'f1', propertyId: '1', rentAmount: 15000, garbageFee: 300, waterPerUnit: 50, isOccupied: true, tenantId: 't1' },
          { id: 'u2', name: 'G02', floorId: 'f1', propertyId: '1', rentAmount: 15000, garbageFee: 300, waterPerUnit: 50, isOccupied: true, tenantId: 't2' },
          { id: 'u3', name: 'G03', floorId: 'f1', propertyId: '1', rentAmount: 12000, garbageFee: 300, waterPerUnit: 50, isOccupied: false },
        ],
      },
      {
        id: 'f2',
        name: '1st Floor',
        number: 1,
        propertyId: '1',
        units: [
          { id: 'u4', name: '101', floorId: 'f2', propertyId: '1', rentAmount: 18000, garbageFee: 300, waterPerUnit: 50, isOccupied: true, tenantId: 't3' },
          { id: 'u5', name: '102', floorId: 'f2', propertyId: '1', rentAmount: 18000, garbageFee: 300, waterPerUnit: 50, isOccupied: false },
        ],
      },
    ],
  },
];

export const mockTenants: Tenant[] = [
  { id: 't1', name: 'Mary Wanjiku', email: 'mary@email.com', phone: '+254723456789', idNumber: '12345678', unitId: 'u1', propertyId: '1', moveInDate: '2024-02-01', balance: 0, overpayment: 2000 },
  { id: 't2', name: 'John Kamau', email: 'john@email.com', phone: '+254734567890', idNumber: '23456789', unitId: 'u2', propertyId: '1', moveInDate: '2024-03-15', balance: 15300, overpayment: 0 },
  { id: 't3', name: 'Grace Akinyi', email: 'grace@email.com', phone: '+254745678901', idNumber: '34567890', unitId: 'u4', propertyId: '1', moveInDate: '2024-01-01', balance: 0, overpayment: 0 },
];

export const mockPayments: Payment[] = [
  { id: 'p1', tenantId: 't1', tenantName: 'Mary Wanjiku', amount: 15800, date: '2024-12-01', status: 'paid', method: 'mpesa', breakdown: { rent: 15000, water: 500, garbage: 300 } },
  { id: 'p2', tenantId: 't2', tenantName: 'John Kamau', amount: 15300, date: '2024-12-05', status: 'pending', method: 'mpesa', breakdown: { rent: 15000, water: 0, garbage: 300 } },
  { id: 'p3', tenantId: 't3', tenantName: 'Grace Akinyi', amount: 18800, date: '2024-12-02', status: 'paid', method: 'mpesa', breakdown: { rent: 18000, water: 500, garbage: 300 } },
  { id: 'p4', tenantId: 't1', tenantName: 'Mary Wanjiku', amount: 15600, date: '2024-11-01', status: 'paid', method: 'mpesa', breakdown: { rent: 15000, water: 300, garbage: 300 } },
  { id: 'p5', tenantId: 't2', tenantName: 'John Kamau', amount: 15300, date: '2024-11-03', status: 'failed', method: 'mpesa', breakdown: { rent: 15000, water: 0, garbage: 300 } },
];

export const mockBillingRecords: BillingRecord[] = [
  { id: 'b1', tenantId: 't1', tenantName: 'Mary Wanjiku', unitName: 'G01', month: '2024-12', currentWaterReading: 1250, previousWaterReading: 1240, waterConsumption: 10, waterPerUnit: 50, waterCost: 500, rent: 15000, garbageFee: 300, totalAmount: 15800, status: 'sent' },
  { id: 'b2', tenantId: 't2', tenantName: 'John Kamau', unitName: 'G02', month: '2024-12', currentWaterReading: 890, previousWaterReading: 890, waterConsumption: 0, waterPerUnit: 50, waterCost: 0, rent: 15000, garbageFee: 300, totalAmount: 15300, status: 'draft' },
  { id: 'b3', tenantId: 't3', tenantName: 'Grace Akinyi', unitName: '101', month: '2024-12', currentWaterReading: 560, previousWaterReading: 550, waterConsumption: 10, waterPerUnit: 50, waterCost: 500, rent: 18000, garbageFee: 300, totalAmount: 18800, status: 'paid' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'system', title: 'Rent Payment Received', message: 'Mary Wanjiku paid KES 15,800 for December rent', date: '2024-12-01', read: false },
  { id: 'n2', type: 'sms', title: 'SMS Reminder Sent', message: 'Reminder sent to John Kamau for pending rent', date: '2024-12-05', read: false },
  { id: 'n3', type: 'email', title: 'Invoice Sent', message: 'December invoice emailed to all tenants', date: '2024-12-01', read: true },
  { id: 'n4', type: 'system', title: 'Payment Failed', message: 'John Kamau M-Pesa payment of KES 15,300 failed', date: '2024-11-03', read: true },
];
