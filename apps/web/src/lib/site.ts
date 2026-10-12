/** Domain web = domain passkey (rpId): di sanalah /.well-known dilayani dan link undangan membuka app. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tekosue.xyz";

/** apps/api publik: nama trip (`GET /api/groups/:id/meta`) dan invoice bertoken (`GET /api/invoices/:number?token=`). */
export const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://api.mulalabs.biz.id").replace(/\/$/, "");

/** Envio (Hasura) GraphQL publik, hanya-baca: data trip untuk /j dan data settle untuk /v. */
export const envioUrl = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "https://graphql.mulalabs.biz.id/v1/graphql";

/** APK Android terbaru (EAS preview). Diganti tiap build baru. */
export const androidApkUrl =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
  "https://expo.dev/artifacts/eas/5ogBLDAEQ_yTqVv5l5K97zpD9HIh_V3OeIcIyb1yJVE.apk";
