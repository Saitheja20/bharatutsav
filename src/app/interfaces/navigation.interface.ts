export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  roles?: string[];
  children?: NavItem[];
  exact?: boolean;
}

export interface Breadcrumb {
  label: string;
  route?: string;
}
