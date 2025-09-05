import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AgentsComponent } from './components/agents/agents.component';
import { FilesComponent } from './components/files/files.component';
import { SystemComponent } from './components/system/system.component';
import { OperationsComponent } from './components/operations/operations.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'agents', component: AgentsComponent },
  { path: 'files', component: FilesComponent },
  { path: 'system', component: SystemComponent },
  { path: 'operations', component: OperationsComponent },
  { path: '**', redirectTo: '/dashboard' }
];
