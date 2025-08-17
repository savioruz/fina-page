export const Sidebar = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard'
		},
		{
			title: 'Master Data',
			items: [
				{
					title: 'Category',
					url: '/dashboard/master/category'
				}
			]
		},
		{
			title: 'Transactions',
			items: [
				{
					title: 'Incomes',
					url: '/dashboard/transactions/incomes'
				},
				{
					title: 'Expenses',
					url: '/dashboard/transactions/expenses'
				}
			]
		},
		{
			title: 'Reports',
			url: '#',
			items: [
				{
					title: 'Monthly Report',
					url: '#'
				},
				{
					title: 'Yearly Report',
					url: '#'
				}
			]
		},
		{
			title: 'Users',
			url: '#',
			items: [
				{
					title: 'Manage Users',
					url: '#'
				},
				{
					title: 'Settings',
					url: '#'
				}
			]
		}
	]
};
