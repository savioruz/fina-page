import { defaultLocale } from '$lib/i18n';
import { oneYearInSeconds } from '@/utils';
import type { Cookies } from '@sveltejs/kit';

export const load = async ({
	cookies,
	request,
	url
}: {
	cookies: Cookies;
	request: Request;
	url: URL;
}) => {
	const { pathname } = url;

	const locale =
		url.searchParams.get('lang') ??
		cookies.get('locale') ??
		getPreferredLocale(request.headers.get('accept-language')) ??
		defaultLocale;

	if (url.searchParams.get('lang')) {
		cookies.set('locale', locale, {
			path: '/',
			maxAge: oneYearInSeconds()
		});
	}

	return {
		locale,
		pathname
	};
};

function getPreferredLocale(acceptLanguage: string | null): string | null {
	if (!acceptLanguage) return null;

	const supportedLocales = ['en', 'id'];
	const languages = acceptLanguage
		.split(',')
		.map((lang) => lang.split(';')[0].trim().toLowerCase())
		.map((lang) => lang.split('-')[0]); // Convert en-US to en

	for (const language of languages) {
		if (supportedLocales.includes(language)) {
			return language;
		}
	}

	return null;
}
