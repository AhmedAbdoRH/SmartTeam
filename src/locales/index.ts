import { en } from './en';
import { ar } from './ar';

// Language data
export const languages = {
  en,
  ar,
} as const;

// Translation function
export function translate(key: string, language: 'en' | 'ar', params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = languages[language];

  // Navigate through nested object structure
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to key if translation not found
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters in the string
  if (params) {
    let result = value;
    Object.entries(params).forEach(([param, val]) => {
      result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
    });
    return result;
  }

  return value;
}

// Type for nested keys (for better TypeScript support)
export type TranslationKey = keyof typeof en;
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];
