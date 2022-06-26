export function* IdGenerator(): IterableIterator<number> {
  let id = 0;
  while (true) {
    yield ++id;
  }
}
