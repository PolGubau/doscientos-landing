import type {
  BlogPosting,
  CreativeWork,
  FAQPage,
  Organization,
  ProfessionalService,
  Service,
  WebSite,
  WithContext,
} from "schema-dts";

export type JsonLdSchema =
  | WithContext<Organization>
  | WithContext<ProfessionalService>
  | WithContext<WebSite>
  | WithContext<BlogPosting>
  | WithContext<Service>
  | WithContext<CreativeWork>
  | WithContext<FAQPage>;

export function absoluteUrl(
  value: string | undefined,
  base: URL,
): string | undefined {
  if (!value) return undefined;
  return new URL(value, base).toString();
}

/** Serialize JSON-LD safely inside an inline script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
