type MapChangeType = "add" | "update" | "delete" | "clear";

interface MapChange<K, V> {
  type: MapChangeType;
  key?: K;
  value?: V;
  oldValue?: V;
}

type MapObserver<K, V> = (change: MapChange<K, V>) => void;

export class ObservableMap<K, V> {
  private map = new Map<K, V>();
  private observers: MapObserver<K, V>[] = [];

  onChange(observer: MapObserver<K, V>) {
    this.observers.push(observer);
  }

  private notify(change: MapChange<K, V>) {
    for (const observer of this.observers) {
      observer(change);
    }
  }

  set(key: K, value: V) {
    const oldValue = this.map.get(key);
    const type: MapChangeType = this.map.has(key) ? "update" : "add";
    this.map.set(key, value);
    this.notify({ type, key, value, oldValue });
  }

  delete(key: K) {
    if (this.map.has(key)) {
      const oldValue = this.map.get(key);
      this.map.delete(key);
      this.notify({ type: "delete", key, oldValue });
    }
  }

  clear() {
    this.map.clear();
    this.notify({ type: "clear" });
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }
}
