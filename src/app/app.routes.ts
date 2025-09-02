import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; // Add .component
import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { MembersComponent} from './components/members/members';

export const routes: Routes = [
    { path: 'login', component: LoginComponent }, // Move login to top for testing
    { path: '', redirectTo: 'login', pathMatch: 'full' }, // Temporarily redirect to login
    { path: 'dashboard', component: DashboardComponent },
    { path: 'transactions', component: TransactionsComponent},
    { path: 'members', component: MembersComponent},
    { path: '**', redirectTo: 'login' } // Temporarily redirect to login
];
