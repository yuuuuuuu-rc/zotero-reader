"""Resolve a Zotero item to a local PDF without copying or modifying it."""

import json
import sys

from zotero_mcp.config import load_config
from zotero_mcp.local_db import LocalZoteroReader


def main() -> None:
    key = sys.argv[1] if len(sys.argv) > 1 else ""
    if len(key) != 8 or not key.isalnum() or key.upper() != key:
        raise ValueError("Invalid Zotero item key")

    with LocalZoteroReader(db_path=load_config().resolve_zotero_db_path()) as reader:
        direct = reader.get_attachment_by_key(key)
        if direct and "pdf" in (direct.get("content_type") or "").lower():
            resolved = reader.resolve_attachment_file(key)
            if resolved:
                print(json.dumps({
                    "path": str(resolved),
                    "attachmentKey": key,
                    "filename": resolved.name,
                }, ensure_ascii=False))
                return

        for attachment in reader.get_attachment_paths(key):
            content_type = attachment.get("content_type") or ""
            resolved = attachment.get("resolved_path")
            if content_type.lower() == "application/pdf" and attachment.get("exists") and resolved:
                print(json.dumps({
                    "path": str(resolved),
                    "attachmentKey": attachment["key"],
                    "filename": resolved.name,
                }, ensure_ascii=False))
                return

    print(json.dumps({"path": None}))


if __name__ == "__main__":
    main()
