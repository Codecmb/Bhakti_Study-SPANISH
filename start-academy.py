#!/usr/bin/env python3

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import os
import re
import shutil
import tempfile
import cgi

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8080

os.chdir(ROOT)


def write_json_atomic(path, data):
    """Write JSON completely before replacing the live file."""
    path = Path(path)

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=path.name + ".",
        suffix=".tmp",
        delete=False
    ) as handle:
        temp_path = Path(handle.name)
        json.dump(
            data,
            handle,
            ensure_ascii=False,
            indent=2
        )
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())

    try:
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


class AcademyHandler(SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ).encode("utf-8")

        self.send_response(status)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path in {
            "/__academy/sandarbhas/content",
            "/__academy/sandarbhas/content/save"
        }:
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(
                    self.rfile.read(length).decode("utf-8")
                )

                work_id = str(payload.get("work_id", "")).strip()
                canonical_id = str(
                    payload.get("canonical_id", "")
                ).strip()

                allowed = {
                    "tattva",
                    "bhagavat",
                    "paramatma",
                    "krsna",
                    "bhakti",
                    "priti"
                }

                if work_id not in allowed:
                    self.send_json({
                        "ok": False,
                        "error": "Sandarbha no válido."
                    }, 400)
                    return

                if not canonical_id:
                    self.send_json({
                        "ok": False,
                        "error": "Se requiere el ID canónico."
                    }, 400)
                    return

                english_path = (
                    ROOT / "sandarbhas" / "sources" /
                    "english-reader" / f"{work_id}.json"
                ).resolve()

                spanish_path = (
                    ROOT / "sandarbhas" / "sources" /
                    "spanish-reader" / f"{work_id}.json"
                ).resolve()

                source_root = (
                    ROOT / "sandarbhas" / "sources"
                ).resolve()

                if source_root not in english_path.parents:
                    raise ValueError("Ruta inglesa no válida.")

                if source_root not in spanish_path.parents:
                    raise ValueError("Ruta española no válida.")

                if not english_path.exists():
                    self.send_json({
                        "ok": False,
                        "error": "No se encontró la fuente inglesa."
                    }, 404)
                    return

                if not spanish_path.exists():
                    self.send_json({
                        "ok": False,
                        "error": "No se encontró la capa española."
                    }, 404)
                    return

                english = json.loads(
                    english_path.read_text(encoding="utf-8")
                )

                spanish = json.loads(
                    spanish_path.read_text(encoding="utf-8")
                )

                english_record = next(
                    (
                        record
                        for record in english.get("records", [])
                        if str(record.get("canonicalId", "")) ==
                        canonical_id
                    ),
                    None
                )

                spanish_record = next(
                    (
                        record
                        for record in spanish.get("records", [])
                        if str(record.get("canonicalId", "")) ==
                        canonical_id
                    ),
                    None
                )

                if english_record is None or spanish_record is None:
                    self.send_json({
                        "ok": False,
                        "error": "No se encontró el anuccheda."
                    }, 404)
                    return

                if self.path == "/__academy/sandarbhas/content":
                    self.send_json({
                        "ok": True,
                        "work_id": work_id,
                        "canonical_id": canonical_id,
                        "record": {
                            "canonicalId": canonical_id,
                            "number": spanish_record.get("number"),
                            "sourceLabel": spanish_record.get(
                                "sourceLabel"
                            ),
                            "sourceHeadingVerified":
                                spanish_record.get(
                                    "sourceHeadingVerified",
                                    False
                                ),
                            "sourceEnglish": english_record.get(
                                "content",
                                ""
                            ),
                            "content": spanish_record.get(
                                "content",
                                ""
                            )
                        }
                    })
                    return

                # Guardar solamente la traducción española.
                spanish_record["content"] = str(
                    payload.get("content", "")
                )

                write_json_atomic(spanish_path, spanish)

                self.send_json({
                    "ok": True,
                    "message": "Traducción del Sandarbha guardada.",
                    "work_id": work_id,
                    "canonical_id": canonical_id,
                    "record": {
                        "canonicalId": canonical_id,
                        "content": spanish_record["content"]
                    }
                })
                return

            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "No se pudo editar el Sandarbha.",
                    "detail": str(exc)
                }, 500)
                return

        if self.path in {
            "/__academy/books/content",
            "/__academy/books/content/save"
        }:
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(
                    self.rfile.read(length).decode("utf-8")
                )

                book_id = str(payload.get("book_id", "")).strip()
                reference = str(payload.get("reference", "")).strip()

                if not book_id or not reference:
                    self.send_json({
                        "ok": False,
                        "error": "Book ID and reference are required."
                    }, 400)
                    return

                registry_path = ROOT / "data" / "books.json"
                registry = json.loads(
                    registry_path.read_text(encoding="utf-8")
                )

                if not isinstance(registry, list):
                    raise ValueError(
                        "Canonical book registry is not a list."
                    )

                meta = next(
                    (
                        book for book in registry
                        if isinstance(book, dict)
                        and str(book.get("id", "")) == book_id
                    ),
                    None
                )

                if meta is None:
                    self.send_json({
                        "ok": False,
                        "error": "Book not found."
                    }, 404)
                    return

                data_path = str(meta.get("dataPath", "")).strip()
                if not data_path:
                    raise ValueError("Book has no dataPath.")

                book_path = (ROOT / data_path).resolve()

                if ROOT.resolve() not in book_path.parents:
                    raise ValueError("Invalid book data path.")

                book = json.loads(
                    book_path.read_text(encoding="utf-8")
                )

                found = None
                for section in book.get("sections", []):
                    for verse in section.get("verses", []):
                        if str(verse.get("reference", "")) == reference:
                            found = verse
                            break
                    if found is not None:
                        break

                if found is None:
                    self.send_json({
                        "ok": False,
                        "error": "Reference not found."
                    }, 404)
                    return

                if self.path == "/__academy/books/content":
                    self.send_json({
                        "ok": True,
                        "book": {
                            "id": meta.get("id"),
                            "title": meta.get("title"),
                            "canonicalId": meta.get("canonicalId")
                        },
                        "record": found
                    })
                    return

                for field in ("synonyms", "translation", "purport"):
                    if field in payload:
                        found[field] = str(payload.get(field, ""))

                write_json_atomic(book_path, book)

                self.send_json({
                    "ok": True,
                    "message": "Book content updated.",
                    "reference": reference,
                    "record": found
                })
                return

            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "Could not edit book content.",
                    "detail": str(exc)
                }, 500)
                return

        if self.path == "/__academy/books/metadata":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(
                    self.rfile.read(length).decode("utf-8")
                )

                book_id = str(payload.get("id", "")).strip()
                if not book_id:
                    self.send_json({
                        "ok": False,
                        "error": "Book ID is required."
                    }, 400)
                    return

                registry_path = ROOT / "data" / "books.json"
                registry = json.loads(
                    registry_path.read_text(encoding="utf-8")
                )

                if not isinstance(registry, list):
                    raise ValueError(
                        "Canonical book registry is not a list."
                    )

                match = next(
                    (
                        book for book in registry
                        if isinstance(book, dict)
                        and str(book.get("id", "")) == book_id
                    ),
                    None
                )

                if match is None:
                    self.send_json({
                        "ok": False,
                        "error": "Book not found."
                    }, 404)
                    return

                fields = {
                    "title": "title",
                    "author": "author",
                    "publisher": "publisher",
                    "source": "source"
                }

                for incoming, stored in fields.items():
                    if incoming in payload:
                        match[stored] = str(
                            payload.get(incoming, "")
                        ).strip()

                if not match.get("title"):
                    self.send_json({
                        "ok": False,
                        "error": "Book title cannot be empty."
                    }, 400)
                    return

                write_json_atomic(
                    registry_path,
                    registry
                )

                self.send_json({
                    "ok": True,
                    "message": "Book metadata updated.",
                    "book": match
                })
                return

            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "Could not update book metadata.",
                    "detail": str(exc)
                }, 500)
                return

        if self.path == "/__academy/books/status":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(
                    self.rfile.read(length).decode("utf-8")
                )

                book_id = str(payload.get("id", "")).strip()
                status = str(payload.get("status", "")).strip()

                if not book_id:
                    self.send_json({
                        "ok": False,
                        "error": "Book ID is required."
                    }, 400)
                    return

                if status not in {"imported", "disabled"}:
                    self.send_json({
                        "ok": False,
                        "error": "Status must be imported or disabled."
                    }, 400)
                    return

                registry_path = ROOT / "data" / "books.json"
                registry = json.loads(
                    registry_path.read_text(encoding="utf-8")
                )

                if not isinstance(registry, list):
                    raise ValueError(
                        "Canonical book registry is not a list."
                    )

                match = next(
                    (
                        book for book in registry
                        if isinstance(book, dict)
                        and str(book.get("id", "")) == book_id
                    ),
                    None
                )

                if match is None:
                    self.send_json({
                        "ok": False,
                        "error": "Book not found."
                    }, 404)
                    return

                match["status"] = status

                write_json_atomic(
                    registry_path,
                    registry
                )

                self.send_json({
                    "ok": True,
                    "message": "Book status updated.",
                    "book": match
                })
                return

            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "Could not update book status.",
                    "detail": str(exc)
                }, 500)
                return

        if self.path == "/__academy/books/replace":
            try:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={
                        "REQUEST_METHOD": "POST",
                        "CONTENT_TYPE": self.headers.get("Content-Type", "")
                    }
                )

                book_id = (
                    form.getfirst("book_id", "") or ""
                ).strip()

                upload = form["book"] if "book" in form else None

                if not book_id:
                    self.send_json({
                        "ok": False,
                        "error": "Book ID is required."
                    }, 400)
                    return

                if upload is None or not getattr(upload, "filename", ""):
                    self.send_json({
                        "ok": False,
                        "error": "Choose a replacement EPUB file."
                    }, 400)
                    return

                filename = Path(upload.filename).name

                if Path(filename).suffix.lower() != ".epub":
                    self.send_json({
                        "ok": False,
                        "error": "Only EPUB books are supported right now."
                    }, 400)
                    return

                registry_path = ROOT / "data" / "books.json"
                registry = json.loads(
                    registry_path.read_text(encoding="utf-8")
                )

                if not isinstance(registry, list):
                    raise ValueError(
                        "Canonical book registry is not a list."
                    )

                index = next(
                    (
                        i for i, item in enumerate(registry)
                        if isinstance(item, dict)
                        and str(item.get("id", "")) == book_id
                    ),
                    None
                )

                if index is None:
                    self.send_json({
                        "ok": False,
                        "error": "Book not found."
                    }, 404)
                    return

                existing = dict(registry[index])

                data_path = str(existing.get("dataPath", "")).strip()

                if not data_path:
                    raise ValueError(
                        "Registered book has no dataPath."
                    )

                destination = ROOT / Path(data_path).parent

                if not destination.exists():
                    raise ValueError(
                        "Registered book directory does not exist."
                    )

                with tempfile.TemporaryDirectory(
                    prefix="bhakti-replace-"
                ) as temp_name:

                    temp = Path(temp_name)
                    source_path = temp / filename

                    with source_path.open("wb") as target:
                        shutil.copyfileobj(upload.file, target)

                    import sys
                    tools_dir = str(ROOT / "tools")
                    if tools_dir not in sys.path:
                        sys.path.insert(0, tools_dir)

                    from import_epub import import_epub

                    preview_dir = temp / "normalized"

                    summary = import_epub(
                        source_path,
                        preview_dir,
                        existing.get("canonicalId") or book_id
                    )

                    normalized_path = preview_dir / "book.json"

                    if not normalized_path.exists():
                        raise ValueError(
                            "Importer did not create book.json."
                        )

                    normalized = json.loads(
                        normalized_path.read_text(encoding="utf-8")
                    )

                    sections = normalized.get("sections", [])

                    if not isinstance(sections, list) or not sections:
                        raise ValueError(
                            "Replacement EPUB produced no readable sections."
                        )

                    records = sum(
                        len(section.get("verses", []))
                        for section in sections
                        if isinstance(section, dict)
                    )

                    if records < 1:
                        raise ValueError(
                            "Replacement EPUB produced no readable records."
                        )

                    source_dir = preview_dir / "source"
                    source_dir.mkdir(exist_ok=True)
                    shutil.copy2(
                        source_path,
                        source_dir / filename
                    )

                    replacement_entry = dict(existing)

                    # Preserve canonical identity and status.
                    replacement_entry.update({
                        "id": existing["id"],
                        "canonicalId":
                            existing.get("canonicalId") or book_id,
                        "title":
                            normalized.get("title")
                            or summary.get("title")
                            or existing.get("title")
                            or book_id,
                        "status":
                            existing.get("status", "imported"),
                        "preferredFormat": "EPUB",
                        "sourceFormat": "EPUB",
                        "author":
                            normalized.get("creator")
                            or summary.get("creator")
                            or existing.get("author", ""),
                        "publisher":
                            normalized.get("publisher")
                            or summary.get("publisher")
                            or existing.get("publisher", ""),
                        "sections": len(sections),
                        "records": records,
                        "dataPath": existing["dataPath"]
                    })

                    backup = temp / "previous"

                    # Swap only after the replacement has fully validated.
                    shutil.move(str(destination), str(backup))

                    try:
                        shutil.copytree(preview_dir, destination)

                        updated = list(registry)
                        updated[index] = replacement_entry

                        write_json_atomic(
                            registry_path,
                            updated
                        )

                    except Exception:
                        shutil.rmtree(
                            destination,
                            ignore_errors=True
                        )

                        if backup.exists():
                            shutil.move(
                                str(backup),
                                str(destination)
                            )

                        raise

                self.send_json({
                    "ok": True,
                    "message": "Book source replaced.",
                    "book": replacement_entry
                })
                return

            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "Book replacement failed.",
                    "detail": str(exc)
                }, 500)
                return

        if self.path != "/__academy/books/import":
            self.send_json({
                "ok": False,
                "error": "Unknown Academy operation."
            }, 404)
            return

        try:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": self.headers.get("Content-Type", "")
                }
            )

            upload = form["book"] if "book" in form else None
            canonical_id = (
                form.getfirst("canonical_id", "") or ""
            ).strip()

            if upload is None or not getattr(upload, "filename", ""):
                self.send_json({
                    "ok": False,
                    "error": "Choose an EPUB file."
                }, 400)
                return

            filename = Path(upload.filename).name

            if Path(filename).suffix.lower() != ".epub":
                self.send_json({
                    "ok": False,
                    "error": "Only EPUB books are supported right now."
                }, 400)
                return

            if canonical_id:
                book_id = re.sub(
                    r"[^a-z0-9]+",
                    "-",
                    canonical_id.lower()
                ).strip("-")
            else:
                book_id = ""

            registry_path = ROOT / "data" / "books.json"
            registry = json.loads(
                registry_path.read_text(encoding="utf-8")
            )

            if not isinstance(registry, list):
                raise ValueError(
                    "Canonical book registry is not a list."
                )

            with tempfile.TemporaryDirectory(
                prefix="bhakti-book-"
            ) as temp_name:

                temp = Path(temp_name)
                source_path = temp / filename

                with source_path.open("wb") as target:
                    shutil.copyfileobj(upload.file, target)

                # Import directly through the existing adapter.
                import sys
                tools_dir = str(ROOT / "tools")
                if tools_dir not in sys.path:
                    sys.path.insert(0, tools_dir)

                from import_epub import import_epub

                preview_dir = temp / "normalized"

                summary = import_epub(
                    source_path,
                    preview_dir,
                    canonical_id or None
                )

                normalized_path = preview_dir / "book.json"

                if not normalized_path.exists():
                    raise ValueError(
                        "Importer did not create book.json."
                    )

                normalized = json.loads(
                    normalized_path.read_text(encoding="utf-8")
                )

                book_id = re.sub(
                    r"[^a-z0-9]+",
                    "-",
                    str(normalized.get("id") or book_id).lower()
                ).strip("-")

                if not book_id:
                    raise ValueError(
                        "The book does not have a usable ID."
                    )

                if any(
                    str(item.get("id", "")).lower() == book_id
                    for item in registry
                    if isinstance(item, dict)
                ):
                    self.send_json({
                        "ok": False,
                        "error":
                            "A book with this ID is already registered.",
                        "book_id": book_id
                    }, 409)
                    return

                destination = ROOT / "library" / "books" / book_id

                if destination.exists():
                    self.send_json({
                        "ok": False,
                        "error":
                            "A book directory with this ID already exists.",
                        "book_id": book_id
                    }, 409)
                    return

                entry = {
                    "id": book_id,
                    "canonicalId":
                        canonical_id or normalized.get("id") or book_id,
                    "title":
                        normalized.get("title") or summary.get("title") or book_id,
                    "status": "imported",
                    "source": "Academy Administrator Import",
                    "preferredFormat": "EPUB",
                    "sourceFormat": "EPUB",
                    "author":
                        normalized.get("creator") or summary.get("creator") or "",
                    "publisher":
                        normalized.get("publisher") or summary.get("publisher") or "",
                    "sections":
                        len(normalized.get("sections", [])),
                    "records":
                        sum(
                            len(section.get("verses", []))
                            for section in normalized.get("sections", [])
                            if isinstance(section, dict)
                        ),
                    "dataPath":
                        f"library/books/{book_id}/book.json"
                }

                # Copy the completed normalized package first.
                shutil.copytree(preview_dir, destination)

                # Keep the uploaded source with the book package.
                source_dir = destination / "source"
                source_dir.mkdir(exist_ok=True)
                shutil.copy2(source_path, source_dir / filename)

                try:
                    updated = registry + [entry]

                    write_json_atomic(
                        registry_path,
                        updated
                    )
                except Exception:
                    shutil.rmtree(destination, ignore_errors=True)
                    raise

            self.send_json({
                "ok": True,
                "message": "Book imported and registered.",
                "book": entry
            }, 201)

        except Exception as exc:
            self.send_json({
                "ok": False,
                "error": "Book import failed.",
                "detail": str(exc)
            }, 500)


    def do_GET(self):
        if self.path == "/__academy/health":
            self.send_json({
                "ok": True,
                "service": "Bhakti Study Academy",
                "mode": "local"
            })
            return

        if self.path == "/__academy/books":
            registry_path = ROOT / "data" / "books.json"

            try:
                registry = json.loads(
                    registry_path.read_text(encoding="utf-8")
                )
            except Exception as exc:
                self.send_json({
                    "ok": False,
                    "error": "Could not read canonical book registry.",
                    "detail": str(exc)
                }, 500)
                return

            books = (
                registry.get("books", [])
                if isinstance(registry, dict)
                else registry
            )

            self.send_json({
                "ok": True,
                "count": len(books),
                "books": books
            })
            return

        super().do_GET()


def main():
    server = ThreadingHTTPServer(
        (HOST, PORT),
        AcademyHandler
    )

    print()
    print("Bhakti Study Academy")
    print("====================")
    print(f"Academy: http://{HOST}:{PORT}/")
    print(f"Manage:  http://{HOST}:{PORT}/admin/")
    print()
    print("Press Ctrl+C to stop.")
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nAcademy stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
