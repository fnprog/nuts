export async function calculateChecksum(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function verifyChecksum(blob: Blob, expectedChecksum: string): Promise<boolean> {
  const actualChecksum = await calculateChecksum(blob);
  return actualChecksum === expectedChecksum;
}
