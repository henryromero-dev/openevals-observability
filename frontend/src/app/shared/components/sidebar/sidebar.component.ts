import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { path: '/chat',        label: 'Chat',        icon: '💬' },
    { path: '/personas',    label: 'Personas',    icon: '🧑‍🎭' },
    { path: '/evaluators',  label: 'Evaluators',  icon: '⚖️' },
    { path: '/simulations', label: 'Simulations', icon: '▶️' },
    { path: '/reports',     label: 'Reports',     icon: '📊' },
  ];
}
