import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { MembersComponent } from './components/members/members';
import { OrganizationsComponent } from './components/organization/organization';
import { AuthGuard } from './guards/auth.guard';
import { ChandaBookComponent } from './components/chanda-book/chanda-book';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'members', component: MembersComponent },
  { path: 'organizations', component: OrganizationsComponent, canActivate: [AuthGuard] },
  { path: 'organizations/:orgId', component: OrganizationsComponent },
  { path: 'chanda-book', component: ChandaBookComponent, title: 'Chanda Book - Festival Ledger' },
  { path: '**', redirectTo: '/dashboard' },
];
