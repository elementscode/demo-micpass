export function timeAgo(d: Date | string): string {
  let seconds = Math.max(0, (Date.now() - +new Date(d)) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  return `${Math.floor(seconds / 86400)}d ago`;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
