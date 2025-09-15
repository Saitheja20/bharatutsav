export interface DonationDocument {
  id: string;
  donorName: string;
  phoneNumber: string;
  amount: number;
  category: string;
  receivedByName: string;
  createdAt: any;
  organizationName?: string;
  [key: string]: any;
}
