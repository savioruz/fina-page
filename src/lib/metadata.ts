export const siteConfig = {
	name: 'sv',
	logo: '/favicon.svg',
	description: '@TODO - Replace with your site description',
	keywords: '@TODO - Replace with your site keywords',
	url: new URL('https://example.com'), // @TODO - Replace with your site URL
	ogImage: new URL('https://example.com/og.png'), // @TODO - Replace with your Open Graph image URL
	links: {
		twitter: new URL('https://twitter.com/example'), // @TODO - Replace with your Twitter URL
		github: new URL('https://github.com/example') // @TODO - Replace with your GitHub URL
	},
	googleVerification: '@TODO - Replace with your Google verification code',
	yandexVerification: '@TODO - Replace with your Yandex verification code'
} as const;

export type SiteConfig = typeof siteConfig;
