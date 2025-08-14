export interface NavItem {
	href: string;
	label: string;
	translationKey: string;
}

export const navigationConfig: NavItem[] = [
	{
		href: '/',
		label: 'Home',
		translationKey: 'home'
	},
	{
		href: '/products',
		label: 'Products',
		translationKey: 'products'
	},
	{
		href: '/blog',
		label: 'Blog',
		translationKey: 'blog'
	},
	{
		href: '/contact',
		label: 'Contact',
		translationKey: 'contact'
	}
];
