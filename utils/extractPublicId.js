export function extractPublicId(url) {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  const publicId = fileName.split(".")[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${publicId}`;
}
