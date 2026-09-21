"""Descobre o host do Transaction Pooler do Supabase (prefixo + região).

O Supabase distribui projetos entre clusters do Supavisor de forma não
determinística (aws-0, aws-1, aws-2...), então sem o dashboard o caminho é
sondar os candidatos. Roda tudo em paralelo e imprime a URI que autenticar.

Uso: SB_PASSWORD='...' python /app/scripts/find_supabase_pooler.py
"""

import asyncio
import os
import sys
from urllib.parse import quote

PROJECT_REF = os.environ.get("SB_REF", "tnetgcojqrhsddzzbcwr")
PASSWORD = os.environ.get("SB_PASSWORD", "")

REGIONS = [
    "sa-east-1",
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "eu-central-1",
    "eu-central-2",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-north-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "ca-central-1",
]
PREFIXES = ["aws-0", "aws-1", "aws-2", "aws-3", "aws-4"]

TENANT_MISS = "tenant/user not found"


async def probe(host: str, sem: asyncio.Semaphore) -> tuple[str, bool, str]:
    import asyncpg

    async with sem:
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=6543,
                    user=f"postgres.{PROJECT_REF}",
                    password=PASSWORD,
                    database="postgres",
                    statement_cache_size=0,
                    timeout=10,
                ),
                timeout=12,
            )
        except Exception as exc:  # noqa: BLE001
            return host, False, f"{type(exc).__name__}: {str(exc)[:80]}"
        try:
            await conn.fetchval("select 1")
            return host, True, "autenticou"
        finally:
            await conn.close()


async def main() -> None:
    if not PASSWORD:
        sys.exit("Defina SB_PASSWORD no ambiente antes de rodar.")

    hosts = [f"{p}-{r}.pooler.supabase.com" for p in PREFIXES for r in REGIONS]
    sem = asyncio.Semaphore(25)
    print(f"sondando {len(hosts)} hosts candidatos...", flush=True)

    results = await asyncio.gather(*(probe(h, sem) for h in hosts))

    winners = [(h, d) for h, ok, d in results if ok]
    # Uma resposta que NÃO seja "tenant not found" indica o cluster certo com outro problema
    # (ex.: senha incorreta) — vale destacar separadamente.
    interesting = [(h, d) for h, ok, d in results if not ok and TENANT_MISS not in d]

    if winners:
        host = winners[0][0]
        uri = (
            f"postgresql://postgres.{PROJECT_REF}:{quote(PASSWORD, safe='')}"
            f"@{host}:6543/postgres"
        )
        print("\n=== POOLER ENCONTRADO ===")
        print(f"host: {host}")
        print(f"DATABASE_URL={uri}")
        return

    print(f"\nnenhum host autenticou ({len(results)} testados).")
    if interesting:
        print("respostas diferentes de 'tenant not found' (investigar):")
        for host, detail in interesting[:10]:
            print(f"  {host}: {detail}")
    else:
        print("todos responderam 'tenant/user not found'.")


if __name__ == "__main__":
    asyncio.run(main())
