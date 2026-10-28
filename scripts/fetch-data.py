"""Fetch the public sequences and codon-usage table used by Codon Studio.

The generated JSON is committed so the web app can run fully offline. Re-run:

    python scripts/fetch-data.py

Sources
-------
- NCBI RefSeq / GenBank via E-utilities
- Kazusa DNA Research Institute, human codon usage table (species 9606)
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DATA.mkdir(parents=True, exist_ok=True)


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "codon-studio/1.0 (course project; data fetch)"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8")


def fetch_cds(accession: str) -> str:
    text = fetch(f"{EUTILS}?db=nuccore&id={accession}&rettype=fasta_cds_na&retmode=text")
    lines = text.strip().splitlines()
    return "".join(line.strip() for line in lines[1:]).upper()


def fetch_region(accession: str, start: int, end: int) -> str:
    url = f"{EUTILS}?db=nuccore&id={accession}&seq_start={start}&seq_stop={end}&rettype=fasta&retmode=text"
    lines = fetch(url).strip().splitlines()
    return "".join(line.strip() for line in lines[1:]).upper()


def fetch_codon_usage() -> dict:
    html = fetch("https://www.kazusa.or.jp/codon/cgi-bin/showcodon.cgi?species=9606&aa=1&style=N")
    block = re.search(r"<PRE>(.*?)</PRE>", html, re.S)
    if not block:
        raise RuntimeError("Could not locate the codon table in the Kazusa response")

    codons: dict[str, dict] = {}
    pattern = re.compile(r"([ACGU]{3})\s+([A-Z*])\s+([\d.]+)\s+([\d.]+)\s*\(\s*(\d+)\)")
    for codon, amino_acid, fraction, per_thousand, count in pattern.findall(block.group(1)):
        codons[codon.replace("U", "T")] = {
            "aminoAcid": amino_acid,
            "fraction": float(fraction),
            "perThousand": float(per_thousand),
            "count": int(count),
        }

    if len(codons) != 64:
        raise RuntimeError(f"Expected 64 codons, parsed {len(codons)}")

    return {
        "source": "Kazusa DNA Research Institute",
        "url": "https://www.kazusa.or.jp/codon/cgi-bin/showcodon.cgi?species=9606",
        "species": "Homo sapiens",
        "taxid": 9606,
        "dataset": "93487 CDS / 40,662,582 codons",
        "geneticCode": "Standard (NCBI table 1)",
        "codons": dict(sorted(codons.items())),
    }


def main() -> None:
    sequences = {
        "HBB": {
            "accession": "NM_000518.5",
            "proteinAccession": "NP_000509.1",
            "region": "CDS 51..494",
            "cds": fetch_cds("NM_000518.5"),
        },
        "INS": {
            "accession": "NM_000207.3",
            "proteinAccession": "NP_000198.1",
            "region": "CDS 60..392",
            "cds": fetch_cds("NM_000207.3"),
        },
        "TP53": {
            "accession": "NM_000546.6",
            "proteinAccession": "NP_000537.3",
            "region": "CDS 143..1324",
            "cds": fetch_cds("NM_000546.6"),
        },
        "S": {
            "accession": "NC_045512.2",
            "proteinAccession": "YP_009724390.1",
            "region": "S CDS 21,563..25,384",
            "cds": fetch_region("NC_045512.2", 21563, 25384),
        },
    }

    for gene, record in sequences.items():
        cds = record["cds"]
        if len(cds) % 3 != 0 or not re.fullmatch(r"[ACGT]+", cds):
            raise RuntimeError(f"Unexpected sequence for {gene}: length={len(cds)}")
        if not cds.startswith("ATG") or cds[-3:] not in {"TAA", "TAG", "TGA"}:
            raise RuntimeError(f"{gene} does not look like a complete CDS")

    payload = {
        "source": "NCBI RefSeq / GenBank via E-utilities",
        "url": "https://www.ncbi.nlm.nih.gov/",
        "fetched": "2026-10-28",
        "sequences": sequences,
    }

    (DATA / "sequences.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA / "codonUsage.json").write_text(
        json.dumps(fetch_codon_usage(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    for gene, record in sequences.items():
        print(f"{gene:5s} {len(record['cds']):5d} bp  {len(record['cds']) // 3:4d} codons  {record['accession']}")


if __name__ == "__main__":
    main()
