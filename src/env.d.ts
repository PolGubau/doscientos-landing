interface ImportMetaEnv {
  readonly PUBLIC_GA_MEASUREMENT_ID: string;
  readonly PUBLIC_CLARITY_ID?: string;
  readonly PUBLIC_LEADS_ENDPOINT?: string;
  readonly PUBLIC_DIAGNOSTIC_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
