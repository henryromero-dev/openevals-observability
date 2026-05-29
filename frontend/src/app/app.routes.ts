import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  {
    path: 'chat',
    loadComponent: () =>
      import('./features/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'personas',
    loadComponent: () =>
      import('./features/personas/personas.component').then((m) => m.PersonasComponent),
  },
  {
    path: 'evaluators',
    loadComponent: () =>
      import('./features/evaluators/evaluators.component').then((m) => m.EvaluatorsComponent),
  },
  {
    path: 'simulations',
    loadComponent: () =>
      import('./features/simulations/simulations.component').then((m) => m.SimulationsComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then((m) => m.ReportsComponent),
  },
  { path: '**', redirectTo: 'chat' },
];
