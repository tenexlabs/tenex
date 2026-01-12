export function replaceOnce(
  contents: string,
  search: string | RegExp,
  replacement: string,
): { changed: boolean; contents: string } {
  if (typeof search === 'string') {
    const idx = contents.indexOf(search)
    if (idx === -1) return { changed: false, contents }
    return {
      changed: true,
      contents: contents.replace(search, replacement),
    }
  }

  if (!search.test(contents)) return { changed: false, contents }
  return {
    changed: true,
    contents: contents.replace(search, replacement),
  }
}

export function replaceOrThrow(
  contents: string,
  search: string | RegExp,
  replacement: string,
  errorMessage: string,
): string {
  const res = replaceOnce(contents, search, replacement)
  if (!res.changed) throw new Error(errorMessage)
  return res.contents
}
