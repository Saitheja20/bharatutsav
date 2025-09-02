import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';

import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { MembersComponent} from './components/members/members';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'transactions', component: TransactionsComponent},
    { path: 'members', component: MembersComponent},
    { path: 'login', component: LoginComponent },
    // A wildcard route to handle any invalid URL and redirect to dashboard
    { path: '**', redirectTo: 'dashboard' }
];
