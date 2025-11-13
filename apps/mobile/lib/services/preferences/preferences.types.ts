export interface Preferences {
  locale: string;
  timezone: string;
  time_format: '12h' | '24h';
  date_format: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  start_week_on_monday: boolean;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  dark_sidebar: boolean;
}

export type PreferencesUpdate = Partial<Preferences>;

export const DEFAULT_PREFERENCES: Preferences = {
  locale: 'en-US',
  timezone: 'UTC',
  time_format: '24h',
  date_format: 'yyyy-mm-dd',
  start_week_on_monday: true,
  currency: 'USD',
  theme: 'system',
  dark_sidebar: false,
};
