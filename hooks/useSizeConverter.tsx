function bytesToSize(bytes: number) {
  const kilobyte = 1024;
  const megabyte = kilobyte * 1024;
  if (!bytes) return;
  if (bytes < kilobyte) {
    return bytes + " Bytes";
  } else if (bytes < megabyte) {
    return (bytes / kilobyte).toFixed(0) + " KB";
  } else {
    return (bytes / megabyte).toFixed(1) + " MB";
  }
}

export default bytesToSize;
