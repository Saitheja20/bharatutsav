// src/app/interfaces/models.ts

// Interface for User details
export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for Organization details
export interface Organization {
    id: string;
    name: string;
    website?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for Transaction details
export interface Transaction {
    id: string;
    userId: string;
    organizationId: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for ChandaBook details
export interface ChandaBook {
    id: string;
    organizationId: string;
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}