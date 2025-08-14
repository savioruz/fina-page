import { dev } from '$app/environment';
import I18n from '@sveltekit-i18n/base';
import parser from '@sveltekit-i18n/parser-default';
import lang from '$lang/lang.json';

export const defaultLocale = 'en';

export const i18n = new I18n({
	parser: parser(),
	log: {
		level: dev ? 'warn' : 'error'
	},
	translations: {
		en: { lang },
		id: { lang }
	},
	loaders: [
		{
			locale: 'en',
			key: 'common',
			loader: async () => (await import('../../i18n/en/common.json')).default
		},
		{
			locale: 'en',
			key: 'navigation',
			loader: async () => (await import('../../i18n/en/navigation.json')).default
		},
		{
			locale: 'id',
			key: 'common',
			loader: async () => (await import('../../i18n/id/common.json')).default
		},
		{
			locale: 'id',
			key: 'navigation',
			loader: async () => (await import('../../i18n/id/navigation.json')).default
		}
	],
	initLocale: defaultLocale
});

export const { t, loading, locales, locale, translations, loadTranslations } = i18n;

// Initialize with default locale
export const initializeI18n = async () => {
	await loadTranslations(defaultLocale, 'common');
	await loadTranslations(defaultLocale, 'navigation');
	locale.set(defaultLocale);
};
