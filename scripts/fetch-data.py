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


def fetch_protein(accession: str) -> str:
    text = fetch(f"{EUTILS}?db=protein&id={accession}&rettype=fasta&retmode=text")
    lines = text.strip().splitlines()
    return "".join(line.strip() for line in lines[1:]).upper()


ORTHOLOGS = [
    {
        "id": "human",
        "commonName": "Human",
        "commonNameZh": "人",
        "latin": "Homo sapiens",
        "accession": "NP_000509.1",
        "group": "Mammal",
        "color": "#c8ff5e",
        "note": "Reference HBB sequence used throughout Codon Studio.",
    },
    {
        "id": "mouse",
        "commonName": "Mouse",
        "commonNameZh": "小鼠",
        "latin": "Mus musculus",
        "accession": "NP_001265090.1",
        "group": "Mammal",
        "color": "#ffd36e",
        "note": "Hbb-b1, one of the adult beta-globin genes.",
    },
    {
        "id": "rat",
        "commonName": "Rat",
        "commonNameZh": "大鼠",
        "latin": "Rattus norvegicus",
        "accession": "NP_150237.1",
        "group": "Mammal",
        "color": "#ff8ba0",
        "note": "Hbb-b1 beta-globin.",
    },
    {
        "id": "cow",
        "commonName": "Cow",
        "commonNameZh": "牛",
        "latin": "Bos taurus",
        "accession": "NP_776342.1",
        "group": "Mammal",
        "color": "#b7a4ff",
        "note": "Ruminant beta-globin; 145 aa in this RefSeq record.",
    },
    {
        "id": "chicken",
        "commonName": "Chicken",
        "commonNameZh": "鸡",
        "latin": "Gallus gallus",
        "accession": "NP_990820.1",
        "group": "Bird",
        "color": "#6ad7ff",
        "note": "Avian beta-globin, a more distant vertebrate ortholog.",
    },
    {
        "id": "frog",
        "commonName": "Clawed frog",
        "commonNameZh": "非洲爪蟾",
        "latin": "Xenopus laevis",
        "accession": "AAH53807.1",
        "group": "Amphibian",
        "color": "#77e6b2",
        "note": "GenBank Hbb protein; amphibian outgroup.",
    },
    {
        "id": "zebrafish",
        "commonName": "Zebrafish",
        "commonNameZh": "斑马鱼",
        "latin": "Danio rerio",
        "accession": "NP_571095.1",
        "group": "Fish",
        "color": "#8fb8ff",
        "note": "Teleost beta-globin; 148 aa in this RefSeq record.",
    },
]


def build_ortholog_payload() -> dict:
    records = []
    for entry in ORTHOLOGS:
        sequence = fetch_protein(entry["accession"])
        if not re.fullmatch(r"[ACDEFGHIKLMNPQRSTVWY]+", sequence):
            raise RuntimeError(f"Unexpected protein characters for {entry['id']}")
        if not 140 <= len(sequence) <= 155:
            raise RuntimeError(f"Unexpected HBB length for {entry['id']}: {len(sequence)}")
        records.append({**entry, "sequence": sequence})

    reference = next(record for record in records if record["id"] == "human")
    if len(reference["sequence"]) != 147 or not reference["sequence"].startswith("MVHLT"):
        raise RuntimeError("Human HBB reference sequence changed unexpectedly")

    return {
        "source": "NCBI RefSeq / GenBank protein records via E-utilities",
        "url": "https://www.ncbi.nlm.nih.gov/protein/",
        "fetched": "2026-10-28",
        "gene": "HBB",
        "description": "Seven vertebrate beta-globin orthologs used for the evolution view.",
        "species": records,
    }


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
        "CFTR": {
            "accession": "NM_000492.4",
            "proteinAccession": "NP_000483.3",
            "region": "CDS 71..4513",
            "cds": fetch_cds("NM_000492.4"),
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
    (DATA / "orthologs.json").write_text(
        json.dumps(build_ortholog_payload(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA / "codonUsage.json").write_text(
        json.dumps(fetch_codon_usage(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    for gene, record in sequences.items():
        print(f"{gene:5s} {len(record['cds']):5d} bp  {len(record['cds']) // 3:4d} codons  {record['accession']}")


if __name__ == "__main__":
    main()
