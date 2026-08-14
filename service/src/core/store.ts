import { emptyContext, type Pending } from "./engine";
import type { RemovalContext } from "./types";
import { Vault } from "./vault";

export interface ProviderRun {
  providerId: string;
  context: RemovalContext;
  pending: Pending;
}

export interface RemovalRequest {
  readonly id: string;
  readonly createdAt: string;
  readonly providerIds: readonly string[];
  runs: Record<string, ProviderRun>;
  readonly vault: Vault;
}

/**
 * Lagring. Avsiktligt i minnet.
 *
 * Brief:en pekar ut PostgreSQL, och gränssnittet nedan är formen en Postgres-adapter
 * ska ha. Men så länge produkten lovar att inte spara något är minnet den ärligaste
 * implementationen: en omstart raderar allt, och det finns ingen kopia att läcka.
 * Byt först när något faktiskt behöver överleva en omstart — och skriv då kryptering
 * i vila och automatisk radering vid avslut samtidigt, inte efteråt.
 */
export interface RequestStore {
  create(providerIds: readonly string[]): RemovalRequest;
  get(id: string): RemovalRequest | undefined;
  save(request: RemovalRequest): void;
  delete(id: string): void;
}

const TTL_MS = 1000 * 60 * 60 * 2; // två timmar, sedan är begäran borta oavsett

class MemoryStore implements RequestStore {
  private readonly requests = new Map<string, { request: RemovalRequest; expires: number }>();

  create(providerIds: readonly string[]): RemovalRequest {
    this.sweep();
    const id = crypto.randomUUID();
    const request: RemovalRequest = {
      id,
      createdAt: new Date().toISOString(),
      providerIds: [...providerIds],
      runs: Object.fromEntries(
        providerIds.map((pid) => [
          pid,
          {
            providerId: pid,
            context: emptyContext(pid),
            pending: { kind: "settled", note: "Inte påbörjad." } satisfies Pending,
          },
        ]),
      ),
      vault: new Vault(),
    };
    this.requests.set(id, { request, expires: Date.now() + TTL_MS });
    return request;
  }

  get(id: string): RemovalRequest | undefined {
    this.sweep();
    return this.requests.get(id)?.request;
  }

  save(request: RemovalRequest): void {
    const existing = this.requests.get(request.id);
    this.requests.set(request.id, {
      request,
      expires: existing?.expires ?? Date.now() + TTL_MS,
    });
  }

  delete(id: string): void {
    this.requests.get(id)?.request.vault.scrub();
    this.requests.delete(id);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, entry] of this.requests) {
      if (entry.expires < now) {
        entry.request.vault.scrub();
        this.requests.delete(id);
      }
    }
  }
}

/**
 * Modulglobal instans. Next kan ladda om modulen i dev, så den hängs på globalThis
 * för att en begäran inte ska försvinna mitt i flödet vid hot reload.
 */
const globalRef = globalThis as unknown as { __fmnStore?: RequestStore };
export const store: RequestStore = globalRef.__fmnStore ?? (globalRef.__fmnStore = new MemoryStore());
