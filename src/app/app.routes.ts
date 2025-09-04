// import { Routes } from '@angular/router';
// import { LoginComponent } from './components/login/login'; // Add .component
// import { DashboardComponent } from './components/dashboard/dashboard';
// import { TransactionsComponent } from './components/transactions/transactions';
// import { MembersComponent} from './components/members/members';
// import { OrganizationService } from './services/organization.service';
// import { OrganizationsComponent } from './components/organization/organization';
// export const routes: Routes = [
//     { path: 'login', component: LoginComponent }, // Move login to top for testing
//     { path: '', redirectTo: 'login', pathMatch: 'full' }, // Temporarily redirect to login
//     { path: 'dashboard', component: DashboardComponent },
//     { path: 'transactions', component: TransactionsComponent},
//     { path: 'members', component: MembersComponent},
//     { path: '**', redirectTo: 'login' }, // Temporarily redirect to login
//     { path: 'organizations', component: OrganizationsComponent },
//     { path: 'organizations/:orgId', component: OrganizationsComponent } // Dashboard for a specific org
// ];



import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { MembersComponent } from './components/members/members';
import { OrganizationsComponent } from './components/organization/organization'; // Fixed import path
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // Better default redirect
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'members', component: MembersComponent },
  { path: 'organizations', component: OrganizationsComponent ,   canActivate: [AuthGuard] },// Add auth guard},
  { path: 'organizations/:orgId', component: OrganizationsComponent }, // Specific org view
  { path: '**', redirectTo: '/dashboard' } // ← MUST BE LAST - catches all unmatched routes
];
