import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { MembersComponent } from './components/members/members';
import { OrganizationsComponent } from './components/organization/organization';
import { AuthGuard } from './guards/auth.guard';
import { ChandaBookComponent } from './components/chanda-book/chanda-book';
import { NotFoundComponent } from './components/not-found/not-found';
import { ServerErrorComponent } from './components/server-error/server-error';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'members', component: MembersComponent, canActivate: [AuthGuard] },
  { path: 'organizations', component: OrganizationsComponent, canActivate: [AuthGuard] },
  { path: 'organizations/:orgId', component: OrganizationsComponent, canActivate: [AuthGuard] },
  {
    path: 'chanda-book',
    component: ChandaBookComponent,
    canActivate: [AuthGuard],
    title: 'Chanda Book - Festival Ledger',
  },
  { path: '500', component: ServerErrorComponent },
  { path: '**', component: NotFoundComponent },
];
