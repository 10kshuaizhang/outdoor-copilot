export type SampleFormat = "gpx" | "kml";

/** Public-facing sample card (analyze page + API). */
export type SampleMeta = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  stats?: string;
  /** Track download URL served by the app. */
  file: string;
};

/** Persisted sample record (includes internal track filename). */
export type SampleRecord = SampleMeta & {
  trackFile: string;
  format: SampleFormat;
  updatedAt: string;
};

export type SampleManifest = {
  version: 1;
  samples: SampleRecord[];
};
