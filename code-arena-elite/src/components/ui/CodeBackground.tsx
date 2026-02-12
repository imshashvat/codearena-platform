import { useEffect, useRef } from "react";

const codeSnippets = [
  "function solve(arr) {",
  "  const n = arr.length;",
  "  let dp = new Array(n);",
  "  for (let i = 0; i < n; i++) {",
  "    dp[i] = Math.max(dp[i-1], arr[i]);",
  "  }",
  "  return dp[n-1];",
  "}",
  "",
  "def binary_search(arr, x):",
  "    low, high = 0, len(arr) - 1",
  "    while low <= high:",
  "        mid = (low + high) // 2",
  "        if arr[mid] == x:",
  "            return mid",
  "        elif arr[mid] < x:",
  "            low = mid + 1",
  "        else:",
  "            high = mid - 1",
  "    return -1",
  "",
  "class Graph:",
  "    def __init__(self, V):",
  "        self.V = V",
  "        self.adj = [[] for _ in range(V)]",
  "",
  "    def bfs(self, s):",
  "        visited = [False] * self.V",
  "        queue = [s]",
  "        visited[s] = True",
  "        while queue:",
  "            v = queue.pop(0)",
  "            for u in self.adj[v]:",
  "                if not visited[u]:",
  "                    queue.append(u)",
  "                    visited[u] = True",
  "",
  "const mergeSort = (arr) => {",
  "  if (arr.length <= 1) return arr;",
  "  const mid = Math.floor(arr.length / 2);",
  "  const left = mergeSort(arr.slice(0, mid));",
  "  const right = mergeSort(arr.slice(mid));",
  "  return merge(left, right);",
  "};",
];

export function CodeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const columns = 3;
    const columnElements: HTMLDivElement[] = [];

    for (let i = 0; i < columns; i++) {
      const column = document.createElement("div");
      column.className = "absolute top-0 font-mono text-xs opacity-[0.07] whitespace-pre select-none pointer-events-none";
      column.style.left = `${(i / columns) * 100}%`;
      column.style.width = `${100 / columns}%`;
      column.style.animation = `code-scroll ${20 + i * 5}s linear infinite`;
      column.style.animationDelay = `${i * -3}s`;
      
      const codeText = [...codeSnippets, ...codeSnippets].join("\n");
      column.textContent = codeText;
      
      container.appendChild(column);
      columnElements.push(column);
    }

    return () => {
      columnElements.forEach((col) => col.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}
